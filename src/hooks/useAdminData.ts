import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const clearAdminSession = () => {
  sessionStorage.removeItem("rayn_admin_session");
  window.dispatchEvent(new CustomEvent("admin-session-expired"));
};

const isSessionExpiredError = (err: unknown) => {
  const anyErr = err as any;
  const msg = String(anyErr?.message ?? "").toLowerCase();
  const status = anyErr?.status;
  return status === 401 || msg.includes("session expired");
};

const invokeAdminFn = async <T,>(fnName: string, body: Record<string, unknown>): Promise<T> => {
  try {
    const { data, error } = await supabase.functions.invoke(fnName, { body });
    if (error) {
      if (isSessionExpiredError(error)) clearAdminSession();
      throw error;
    }
    return data as T;
  } catch (sdkError: any) {
    // Fallback: direct fetch with 15s timeout
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!projectId || !apiKey) throw sdkError;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/${fnName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey, Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const payload = await res.json();
      if (!res.ok) {
        if (res.status === 401) clearAdminSession();
        throw new Error(payload?.error || `Function ${fnName} failed (${res.status})`);
      }
      return payload as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

// Helper to get admin session
const getAdminSession = () => {
  const stored = sessionStorage.getItem("rayn_admin_session");
  if (!stored) return null;
  return JSON.parse(stored);
};

// Helper to get shipping session
const getShippingSession = () => {
  const stored = sessionStorage.getItem("rayn_shipping_session");
  if (stored) {
    return JSON.parse(stored);
  }
  // Fallback to old format
  const email = sessionStorage.getItem("shipping_email");
  const token = sessionStorage.getItem("shipping_token");
  if (email && token) return { email, token };
  return null;
};

// ============ ORDERS ============
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string | null;
}

export interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  subtotal: number;
  discount: number | null;
  shipping: number | null;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  coupon_code: string | null;
  affiliate_code: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  return_status: string | null;
  return_reason: string | null;
  return_details: string | null;
  return_requested_at: string | null;
  cash_received: boolean;
}

const mergeOrders = (existing: Order[], incoming: Order[]): Order[] => {
  const byId = new Map<string, Order>();
  for (const order of existing) byId.set(order.id, order);
  for (const order of incoming) byId.set(order.id, order);

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const useAdminOrders = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No admin session found");

      // Fast first paint: fetch first page only, hydrate older pages in background
      const pageSize = 250;
      const maxPages = 200;

      const firstPage = await invokeAdminFn<{ orders: Order[]; has_more?: boolean }>(
        "get-admin-orders",
        {
          admin_email: session.email,
          admin_token: session.token,
          page: 1,
          page_size: pageSize,
        }
      );

      const initialOrders = firstPage.orders || [];
      const hasMoreFirstPage = firstPage.has_more ?? (initialOrders.length === pageSize);

      if (hasMoreFirstPage) {
        void (async () => {
          let accumulated = initialOrders;

          for (let page = 2; page <= maxPages; page++) {
            try {
              const res = await invokeAdminFn<{ orders: Order[]; has_more?: boolean }>(
                "get-admin-orders",
                {
                  admin_email: session.email,
                  admin_token: session.token,
                  page,
                  page_size: pageSize,
                }
              );

              const nextOrders = res.orders || [];
              if (nextOrders.length === 0) break;

              accumulated = mergeOrders(accumulated, nextOrders);
              queryClient.setQueryData<Order[]>(["admin", "orders"], accumulated);

              const hasMore = res.has_more ?? (nextOrders.length === pageSize);
              if (!hasMore) break;
            } catch (backgroundError) {
              console.error("Background order pagination stopped:", backgroundError);
              break;
            }
          }
        })();
      }

      return initialOrders;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
  });
};

// ============ CUSTOMERS ============
export interface CustomerData {
  email: string;
  phone: string | null;
  created_at: string;
}

export const useAdminCustomers = () => {
  return useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-admin-customers", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.customers || []) as CustomerData[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ AFFILIATES ============
export interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  commission_percent: number;
  coupon_discount_percent: number;
  total_earnings: number;
  total_referrals: number;
  is_active: boolean;
  created_at: string;
}

export interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalReferrals: number;
  totalRevenue: number;
  totalCommissions: number;
}

export const useAdminAffiliates = () => {
  return useQuery({
    queryKey: ["admin", "affiliates"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-admin-affiliates", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return {
        affiliates: (data.affiliates || []) as Affiliate[],
        stats: (data.stats || {
          totalAffiliates: 0,
          activeAffiliates: 0,
          totalReferrals: 0,
          totalRevenue: 0,
          totalCommissions: 0,
        }) as AffiliateStats,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ COUPONS ============
export interface Coupon {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  coupon_type?: string | null;
  is_bogo?: boolean | null;
  user_id?: string | null;
  user_email?: string;
}

export const useAdminCoupons = () => {
  return useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("manage-coupons", {
        body: { 
          action: "list",
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.coupons || []) as Coupon[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminLoyaltyCoupons = () => {
  return useQuery({
    queryKey: ["admin", "loyalty-coupons"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("manage-coupons", {
        body: { 
          action: "list_loyalty",
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.coupons || []) as Coupon[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ ACTIVITY LOGS ============
export interface ActivityLog {
  id: string;
  actor_email: string;
  actor_role: string;
  action_type: string;
  action_details: Record<string, unknown>;
  order_id?: string;
  order_number?: string;
  created_at: string;
}

export const useAdminActivityLogs = () => {
  return useQuery({
    queryKey: ["admin", "activity-logs"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-activity-logs", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.logs || []) as ActivityLog[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ STAFF ============
export interface StaffMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  login_count?: number;
  last_login?: string;
}

export const useAdminStaff = () => {
  return useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-staff-list", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.staff || []) as StaffMember[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ DASHBOARD STATS ============
export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

export interface PaymentBreakdown {
  cod: {
    orders: number;
    revenue: number;
    pending: number;
    delivered: number;
  };
  online: {
    orders: number;
    revenue: number;
    pending: number;
    delivered: number;
  };
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
  cod: number;
  online: number;
}

export interface AllTimeStats {
  total: number;
  totalRevenue: number;
  codRevenue: number;
  onlineRevenue: number;
  codOrders: number;
  onlineOrders: number;
}

export interface DashboardData {
  stats: OrderStats;
  allTimeStats: AllTimeStats;
  paymentBreakdown: PaymentBreakdown;
  monthlyRevenue: MonthlyRevenue[];
  recentOrders: Order[];
}

export const useAdminDashboard = (dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: ["admin", "dashboard", dateFrom, dateTo],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-admin-stats", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          date_from: dateFrom,
          date_to: dateTo,
        },
      });

      if (error) throw error;
      return data as DashboardData;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard
  });
};

// ============ SHIPPING ORDERS ============
export const useShippingOrders = () => {
  return useQuery({
    queryKey: ["shipping", "orders"],
    queryFn: async () => {
      const session = getShippingSession();
      if (!session) throw new Error("No shipping session found");

      const { data, error } = await supabase.functions.invoke("get-admin-orders", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.orders || []) as Order[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ SHOP ORDERS ============
export interface ShopOrder {
  id: string;
  shop_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  products: { name: string; quantity: number }[];
  total_bottles: number;
  notes: string | null;
  order_date: string;
  status: string;
}

export const useShopOrders = (sessionType: 'admin' | 'shipping' = 'admin') => {
  return useQuery({
    queryKey: ["shop-orders", sessionType],
    queryFn: async () => {
      let session;
      if (sessionType === 'admin') {
        session = getAdminSession();
      } else {
        session = getShippingSession();
      }
      
      if (!session) throw new Error(`No ${sessionType} session found`);

      const { data, error } = await supabase.functions.invoke("manage-shop-orders", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          action: "list",
        },
      });

      if (error) throw error;
      return {
        shopOrders: (data.shop_orders || []) as ShopOrder[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ INVALIDATION HELPERS ============
export const useInvalidateAdminData = () => {
  const queryClient = useQueryClient();

  return {
    invalidateOrders: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
    invalidateCustomers: () => queryClient.invalidateQueries({ queryKey: ["admin", "customers"] }),
    invalidateAffiliates: () => queryClient.invalidateQueries({ queryKey: ["admin", "affiliates"] }),
    invalidateCoupons: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
    invalidateLoyaltyCoupons: () => queryClient.invalidateQueries({ queryKey: ["admin", "loyalty-coupons"] }),
    invalidateActivityLogs: () => queryClient.invalidateQueries({ queryKey: ["admin", "activity-logs"] }),
    invalidateStaff: () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
    invalidateShippingOrders: () => queryClient.invalidateQueries({ queryKey: ["shipping", "orders"] }),
    invalidateShopOrders: () => queryClient.invalidateQueries({ queryKey: ["shop-orders"] }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["shipping"] });
      queryClient.invalidateQueries({ queryKey: ["shop-orders"] });
    },
  };
};