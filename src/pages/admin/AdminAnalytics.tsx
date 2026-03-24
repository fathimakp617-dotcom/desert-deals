import { useState, useMemo, memo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import {
  Loader2, ExternalLink, ShieldBan, RefreshCw,
} from "lucide-react";

const getAdminSession = () => {
  const stored = sessionStorage.getItem("rayn_admin_session");
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    if (session.expiry > Date.now()) return session;
  } catch { return null; }
  return null;
};

const formatCurrency = (val: number) => `AED ${Math.round(val).toLocaleString()}`;
const formatCompact = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString();
};

// Shopify-style live dot
const LiveDot = () => (
  <span className="relative flex h-2 w-2 ml-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
  </span>
);

// Shopify-style mini sparkline using area chart
const MiniSparkline = ({ data, color = "#5c6ac4" }: { data: number[]; color?: string }) => {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={80} height={30}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Shopify-style stat box
const ShopifyStatBox = ({ label, value, sparkData, suffix, color = "#5c6ac4" }: {
  label: string; value: string | number; sparkData?: number[]; suffix?: string; color?: string;
}) => (
  <div className="border border-border rounded-xl p-4 bg-card">
    <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
    <div className="flex items-end justify-between">
      <div>
        <span className="text-xl font-semibold text-foreground">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground ml-1">{suffix}</span>}
      </div>
      {sparkData && sparkData.length > 1 && (
        <MiniSparkline data={sparkData} color={color} />
      )}
    </div>
  </div>
);

// Customer behavior section like Shopify
const CustomerBehavior = ({ activeCarts, checkingOut, purchased, funnelData }: {
  activeCarts: number; checkingOut: number; purchased: number; funnelData: number[];
}) => (
  <div className="border border-border rounded-xl p-4 bg-card">
    <h3 className="text-sm font-semibold text-foreground mb-3">Customer behavior</h3>
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div>
        <p className="text-xs text-muted-foreground">Active carts</p>
        <p className="text-lg font-semibold text-foreground">{activeCarts}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Checking out</p>
        <p className="text-lg font-semibold text-foreground">{checkingOut}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Purchased</p>
        <p className="text-lg font-semibold text-foreground">{purchased}</p>
      </div>
    </div>
    {/* Funnel chart like Shopify's stacked area */}
    {funnelData.length > 0 && (
      <div className="h-[80px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={funnelData.map((v, i) => ({ i, carts: v, checkout: Math.min(v, funnelData[0] * 0.3) }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5c6ac4" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#5c6ac4" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area type="stepAfter" dataKey="carts" stroke="#5c6ac4" fill="url(#funnelGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

// Sessions by location (horizontal bars like Shopify)
const SessionsByLocation = ({ countries }: { countries: any[] }) => {
  if (!countries || countries.length === 0) return null;
  const max = countries[0]?.count || 1;
  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <h3 className="text-sm font-semibold text-foreground mb-3">Sessions by location</h3>
      <div className="space-y-3">
        {countries.slice(0, 8).map((c: any) => (
          <div key={c.country}>
            <p className="text-xs text-muted-foreground mb-1">{c.country}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${Math.max((c.count / max) * 100, 4)}%`,
                    backgroundColor: "#36a3f7",
                  }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-8 text-right">{c.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminAnalytics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("live");

  const dateFrom = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "1d": return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case "365d": return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }, [dateRange]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-analytics", dateRange],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("get-analytics", {
        body: { admin_email: session.email, admin_token: session.token, date_from: dateFrom },
      });
      if (error) throw error;
      if (data?.error === "Invalid session" || data?.error === "Unauthorized") {
        window.dispatchEvent(new Event("admin-session-expired"));
        throw new Error("Session expired");
      }
      return data;
    },
    refetchInterval: 15000,
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ country_code, is_active }: { country_code: string; is_active: boolean }) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");
      const { error } = await supabase.functions.invoke("manage-blocked-countries", {
        body: { action: "toggle", country_code, is_active, admin_email: session.email, admin_token: session.token },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      toast({ title: "Country block updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const {
    live_visitors = 0, live_carts = 0,
    total_sales = 0, total_orders = 0,
    add_to_cart_count = 0, checkout_count = 0,
    total_sessions = 0, total_views = 0,
    top_products = [], top_products_by_sales = [],
    sources = [], countries = [],
    daily_views = [], daily_sales = [],
    top_pages = [], blocked_countries = [],
  } = data || {};

  // Generate sparkline data from daily_views
  const sessionSparkData = (daily_views || []).map((d: any) => d.count || 0);
  const salesSparkData = (daily_sales || []).map((d: any) => d.revenue || 0);
  const ordersSparkData = (daily_sales || []).map((d: any) => d.orders || 0);

  return (
    <div className="space-y-0">
      {/* Shopify-style Tabs at top */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b border-border pb-0 mb-0">
          <TabsList className="bg-transparent border-0 p-0 h-auto gap-0">
            <TabsTrigger
              value="live"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium"
            >
              Live View
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium"
            >
              Reports
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 pb-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <a href="https://clarity.microsoft.com/projects/view/vkri0s8s8o/dashboard" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>

        {/* =================== LIVE VIEW TAB =================== */}
        <TabsContent value="live" className="mt-0 pt-5 space-y-5">
          {/* Header with live dot */}
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-semibold text-foreground">Live View</h1>
            <LiveDot />
            <span className="text-xs text-muted-foreground ml-2">Just now</span>
          </div>

          {/* 2x2 stat grid like Shopify */}
          <div className="grid grid-cols-2 gap-3">
            <ShopifyStatBox
              label="Visitors right now"
              value={live_visitors}
            />
            <ShopifyStatBox
              label="Total sales"
              value={formatCurrency(total_sales)}
              sparkData={salesSparkData}
              color="#5c6ac4"
            />
            <ShopifyStatBox
              label="Sessions"
              value={formatCompact(total_sessions)}
              sparkData={sessionSparkData}
              color="#5c6ac4"
            />
            <ShopifyStatBox
              label="Orders"
              value={total_orders}
              sparkData={ordersSparkData}
              color="#5c6ac4"
            />
          </div>

          {/* Customer behavior */}
          <CustomerBehavior
            activeCarts={live_carts}
            checkingOut={checkout_count}
            purchased={total_orders}
            funnelData={[live_carts, checkout_count, total_orders]}
          />

          {/* Sessions by location */}
          <SessionsByLocation countries={countries} />

          {/* New vs returning customers */}
          <div className="border border-border rounded-xl p-4 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">New vs returning customers</h3>
            {total_orders > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New customers</span>
                  <span className="font-medium text-foreground">{total_orders}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Returning customers</span>
                  <span className="font-medium text-foreground">0</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data for this date range</p>
            )}
          </div>

          {/* Total sales by product */}
          <div className="border border-border rounded-xl p-4 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Total sales by product</h3>
            {top_products_by_sales.length > 0 ? (
              <div className="space-y-3">
                {top_products_by_sales.slice(0, 5).map((p: any) => (
                  <div key={p.product_id} className="flex items-center gap-3">
                    {p.image && (
                      <img src={p.image} alt="" className="w-10 h-10 rounded object-contain bg-white border" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.units_sold} sold</p>
                    </div>
                    <span className="text-sm font-medium text-foreground">{formatCurrency(p.revenue || p.price * p.units_sold)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data for this date range</p>
            )}
          </div>
        </TabsContent>

        {/* =================== REPORTS TAB =================== */}
        <TabsContent value="reports" className="mt-0 pt-5 space-y-5">
          {/* Date range selector */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Reports</h1>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="365d">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sales & Sessions charts side by side */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="border border-border rounded-xl p-4 bg-card">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Total sales</p>
              <p className="text-xl font-semibold text-foreground mb-3">{formatCurrency(total_sales)}</p>
              {daily_sales.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={daily_sales}>
                    <defs>
                      <linearGradient id="salesG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5c6ac4" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#5c6ac4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => formatCompact(v)} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="revenue" stroke="#5c6ac4" strokeWidth={2} fill="url(#salesG)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No sales data</p>
              )}
            </div>

            <div className="border border-border rounded-xl p-4 bg-card">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Online store sessions</p>
              <p className="text-xl font-semibold text-foreground mb-3">{formatCompact(total_sessions)}</p>
              {daily_views.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={daily_views}>
                    <defs>
                      <linearGradient id="sessG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5c6ac4" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#5c6ac4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#5c6ac4" strokeWidth={2} fill="url(#sessG)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No session data</p>
              )}
            </div>
          </div>

          {/* Conversion funnel */}
          <div className="border border-border rounded-xl p-4 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Online store conversion rate</h3>
            <div className="space-y-3">
              {[
                { label: "Sessions", value: total_sessions, pct: 100 },
                { label: "Added to cart", value: add_to_cart_count, pct: total_sessions > 0 ? (add_to_cart_count / total_sessions) * 100 : 0 },
                { label: "Reached checkout", value: checkout_count, pct: total_sessions > 0 ? (checkout_count / total_sessions) * 100 : 0 },
                { label: "Sessions converted", value: total_orders, pct: total_sessions > 0 ? (total_orders / total_sessions) * 100 : 0 },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">
                      {item.value.toLocaleString()}
                      <span className="text-muted-foreground text-xs ml-1">({item.pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(item.pct, 0.5)}%`, backgroundColor: "#5c6ac4" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top products side by side */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="border border-border rounded-xl p-4 bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top products by units sold</h3>
              {top_products_by_sales.length > 0 ? (
                <div className="space-y-3">
                  {top_products_by_sales.slice(0, 8).map((p: any, i: number) => (
                    <div key={p.product_id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-contain bg-white border" />}
                      <p className="text-sm flex-1 text-foreground truncate">{p.name}</p>
                      <span className="text-sm font-medium text-foreground">{p.units_sold}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No data</p>
              )}
            </div>
            <div className="border border-border rounded-xl p-4 bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top products by page views</h3>
              {top_products.length > 0 ? (
                <div className="space-y-3">
                  {top_products.slice(0, 8).map((p: any, i: number) => (
                    <div key={p.product_id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-contain bg-white border" />}
                      <p className="text-sm flex-1 text-foreground truncate">{p.name}</p>
                      <span className="text-sm font-medium text-foreground">{p.views}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No data</p>
              )}
            </div>
          </div>

          {/* Traffic sources */}
          <div className="border border-border rounded-xl p-4 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Traffic sources</h3>
            {sources.length > 0 ? (
              <div className="space-y-2">
                {sources.map((s: any) => {
                  const pct = total_views > 0 ? ((s.count / total_views) * 100) : 0;
                  return (
                    <div key={s.source} className="flex items-center gap-3">
                      <span className="text-sm flex-1 text-foreground">{s.source}</span>
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: "#5c6ac4" }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-12 text-right">{s.count}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No traffic data</p>
            )}
          </div>

          {/* Top pages */}
          <div className="border border-border rounded-xl p-4 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Top landing pages</h3>
            <div className="space-y-2">
              {top_pages.slice(0, 10).map((p: any) => (
                <div key={p.page} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-foreground font-mono text-xs truncate">{p.page}</span>
                  <span className="font-medium text-foreground">{p.count.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {total_views > 0 ? ((p.count / total_views) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
              {top_pages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data</p>
              )}
            </div>
          </div>

          {/* Geo blocking */}
          <div className="grid lg:grid-cols-2 gap-4">
            <SessionsByLocation countries={countries} />
            <div className="border border-border rounded-xl p-4 bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ShieldBan className="h-4 w-4" />
                Blocked countries
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {blocked_countries.map((bc: any) => (
                  <div key={bc.country_code} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                    <span className="text-sm text-foreground">{bc.country_name} ({bc.country_code})</span>
                    <Switch
                      checked={bc.is_active}
                      onCheckedChange={(checked) =>
                        toggleBlockMutation.mutate({ country_code: bc.country_code, is_active: checked })
                      }
                    />
                  </div>
                ))}
                {blocked_countries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No blocked countries</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default memo(AdminAnalytics);
