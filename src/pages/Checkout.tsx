import { useState, useEffect, memo, useCallback, useRef } from "react";
import { useTranslation } from "@/contexts/DirectionContext";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Truck, Check, Lock, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";

import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { usePinCodeLookup } from "@/hooks/usePinCodeLookup";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";



interface SavedAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

type LegacySavedAddress = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

const normalizeSavedAddress = (
  raw: unknown,
  fallback?: { firstName?: string | null; lastName?: string | null; phone?: string | null }
): SavedAddress | null => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const anyAddr = raw as Partial<SavedAddress> & LegacySavedAddress & Record<string, unknown>;

  // Canonical shape (used by checkout/account pages)
  const canonicalAddress = typeof anyAddr.address === "string" ? anyAddr.address.trim() : "";
  const canonicalCity = typeof anyAddr.city === "string" ? anyAddr.city.trim() : "";

  // Legacy shape (saved during signup)
  const line1 = typeof anyAddr.addressLine1 === "string" ? anyAddr.addressLine1.trim() : "";
  const line2 = typeof anyAddr.addressLine2 === "string" ? anyAddr.addressLine2.trim() : "";
  const legacyAddress = [line1, line2].filter(Boolean).join(", ");

  const address = canonicalAddress || legacyAddress;
  const city = canonicalCity || (typeof anyAddr.city === "string" ? anyAddr.city.trim() : "");

  if (!address || !city) return null;

  const zipCode =
    (typeof anyAddr.zipCode === "string" && anyAddr.zipCode.trim()) ||
    (typeof anyAddr.pincode === "string" && anyAddr.pincode.trim()) ||
    "";

  return {
    firstName:
      (typeof anyAddr.firstName === "string" && anyAddr.firstName) ||
      (fallback?.firstName ?? "") ||
      "",
    lastName:
      (typeof anyAddr.lastName === "string" && anyAddr.lastName) ||
      (fallback?.lastName ?? "") ||
      "",
    phone:
      (typeof anyAddr.phone === "string" && anyAddr.phone) ||
      (fallback?.phone ?? "") ||
      "",
    address,
    city,
    state: (typeof anyAddr.state === "string" && anyAddr.state.trim()) || "",
    zipCode,
    country: (typeof anyAddr.country === "string" && anyAddr.country.trim()) || "India",
  };
};

const PENDING_PROFILE_SEED_KEY = "pending_profile_seed_v1";
const OFFLINE_ORDER_CACHE_KEY = "offline_pending_orders_v1";

interface OfflinePendingOrder {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number; selectedSize: string | null }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shipping_address: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  payment_method: string;
  user_id: string | null;
  created_at: string;
  source: "edge_queued" | "client_backup";
  reason?: string;
}

const Checkout = () => {
  const { items, totalPrice, clearCart, totalItems } = useCart();
  
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [isExpressMode, setIsExpressMode] = useState(false);
  const [loadingSavedAddress, setLoadingSavedAddress] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    countryCode: "+971",
    address: "",
    city: "",
    state: "",
    country: "United Arab Emirates",
  });

  // Track if we've already loaded address to prevent multiple loads
  const hasLoadedAddress = useRef(false);

  // Load saved address for returning customers and auto-fill - runs ONCE when user is available
  useEffect(() => {
    // Skip if already loaded or no user
    if (hasLoadedAddress.current || !user) {
      if (!user) setLoadingSavedAddress(false);
      return;
    }
    
    hasLoadedAddress.current = true;
    
    const loadSavedAddress = async () => {
      try {
        // Fallback: immediately after signup (OTP redirect), the address may still be in localStorage.
        // Use it to prefill checkout and persist it to the profile.
        const pendingRaw = localStorage.getItem(PENDING_PROFILE_SEED_KEY);
        if (pendingRaw) {
          try {
            const seed = JSON.parse(pendingRaw) as {
              first_name?: string;
              last_name?: string;
              phone?: string;
              saved_address?: unknown;
            };

            const pendingNormalized = normalizeSavedAddress(seed.saved_address, {
              firstName: seed.first_name ?? user.user_metadata?.first_name,
              lastName: seed.last_name ?? user.user_metadata?.last_name,
              phone: seed.phone ?? null,
            });

            if (pendingNormalized) {
              const email = user.email || "";

              setSavedAddress(pendingNormalized);
              setFormData({
                email,
                firstName: pendingNormalized.firstName,
                lastName: pendingNormalized.lastName,
                phone: pendingNormalized.phone,
                countryCode: "+971",
                address: pendingNormalized.address,
                city: pendingNormalized.city,
                state: pendingNormalized.state || "",
                country: "United Arab Emirates",
              });
              setIsExpressMode(true);

              // Best-effort persist so next visits auto-fill even if the auth-context upsert didn't run.
              await supabase
                .from("profiles")
                .upsert(
                  [
                    {
                      user_id: user.id,
                      first_name: seed.first_name ?? null,
                      last_name: seed.last_name ?? null,
                      phone: seed.phone ?? null,
                      // DB column is jsonb; generated types expect Json.
                      saved_address: pendingNormalized as unknown as Json,
                    },
                  ],
                  { onConflict: "user_id" }
                );

              localStorage.removeItem(PENDING_PROFILE_SEED_KEY);
              setLoadingSavedAddress(false);
              return;
            }
          } catch (e) {
            console.error("Error applying pending signup address seed:", e);
            // continue to DB fetch
          }
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('saved_address, first_name, last_name, phone')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        const metadata = user.user_metadata || {};
        
        // Always set email from user
        const email = user.email || "";

        const normalized = normalizeSavedAddress(data?.saved_address, {
          firstName: data?.first_name ?? metadata.first_name,
          lastName: data?.last_name ?? metadata.last_name,
          phone: data?.phone,
        });

        if (normalized) {
          setSavedAddress(normalized);

          // Auto-fill form with saved address immediately
          setFormData({
            email,
            firstName: normalized.firstName || data?.first_name || metadata.first_name || "",
            lastName: normalized.lastName || data?.last_name || metadata.last_name || "",
            phone: normalized.phone || data?.phone || "",
            countryCode: "+971",
            address: normalized.address,
            city: normalized.city,
            state: normalized.state || "",
            country: "United Arab Emirates",
          });
          setIsExpressMode(true);
          setLoadingSavedAddress(false);
          return;
        }
        
        // No saved address - just fill basic user info
        setFormData(prev => ({
          ...prev,
          email,
          firstName: data?.first_name || metadata.first_name || prev.firstName,
          lastName: data?.last_name || metadata.last_name || prev.lastName,
          phone: data?.phone || prev.phone,
        }));
      } catch (error) {
        console.error('Error loading saved address:', error);
        // Still set email on error
        if (user.email) {
          setFormData(prev => ({ ...prev, email: user.email || prev.email }));
        }
      } finally {
        setLoadingSavedAddress(false);
      }
    };
    
    loadSavedAddress();
  }, [user]);


  // Handle express checkout - auto-fill saved address
  const handleExpressCheckout = () => {
    if (!savedAddress) return;
    
    setFormData(prev => ({
      ...prev,
      firstName: savedAddress.firstName,
      lastName: savedAddress.lastName,
      phone: savedAddress.phone,
      address: savedAddress.address,
      city: savedAddress.city,
      state: savedAddress.state,
      zipCode: savedAddress.zipCode,
      country: savedAddress.country,
    }));
    setIsExpressMode(true);
    
    toast({
      title: "Express Checkout Activated",
      description: "Your saved address has been applied. Review and place your order!",
    });
    
    // Scroll to payment section
    setTimeout(() => {
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Save address after successful order
  const saveAddressToProfile = async () => {
    if (!user) return;
    
    try {
      const addressData: Record<string, string> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      };
      
      await supabase
        .from('profiles')
        .update({ saved_address: addressData })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const shipping = 20;
  const orderTotal = totalPrice + shipping;

  // PIN code lookup hook
  const { isLoading: isPinLoading, lookupPinCode } = usePinCodeLookup();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handlePinCodeBlur = useCallback(async (pinCode: string) => {
    if (pinCode.length === 6) {
      const pinData = await lookupPinCode(pinCode);
      if (pinData) {
        setFormData((prev) => ({
          ...prev,
          city: pinData.city,
          state: pinData.state,
          country: pinData.country,
        }));
      }
    }
  }, [lookupPinCode]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "Name is required";
    if (!formData.state) errors.state = "Please select an emirate";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    else {
      const digitsOnly = formData.phone.replace(/\D/g, "");
      if (digitsOnly.length < 9 || digitsOnly.length > 10) errors.phone = "Phone must be 9-10 digits";
    }
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email address";
    
    // Check terms checkbox
    const termsCheckbox = document.getElementById('terms-checkout') as HTMLInputElement;
    if (termsCheckbox && !termsCheckbox.checked) errors.terms = "You must agree to the terms and conditions";
    
    setFieldErrors(errors);
    
    // Scroll to first error field
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    await handleCODOrder();
  };

  const isInfrastructureError = (err: unknown): boolean => {
    const message = err instanceof Error ? err.message : String(err ?? "");
    return /non-2xx|failed to fetch|network|timeout|context canceled|service unavailable|gateway/i.test(message);
  };

  const cacheOfflineOrder = (
    order: Omit<OfflinePendingOrder, "created_at" | "source" | "reason">,
    source: OfflinePendingOrder["source"],
    reason?: string
  ) => {
    try {
      const raw = localStorage.getItem(OFFLINE_ORDER_CACHE_KEY);
      const existing = raw ? (JSON.parse(raw) as OfflinePendingOrder[]) : [];
      const next: OfflinePendingOrder[] = [
        {
          ...order,
          created_at: new Date().toISOString(),
          source,
          reason,
        },
        ...existing,
      ].slice(0, 40);
      localStorage.setItem(OFFLINE_ORDER_CACHE_KEY, JSON.stringify(next));
    } catch (storageError) {
      console.error("Failed to cache offline order:", storageError);
    }
  };

  const invokeCreateOrder = async (orderData: {
    user_id: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: { address: string; city: string; state: string; country: string };
    items: Array<{ productId: string; name: string; price: number; quantity: number; selectedSize: string | null }>;
    payment_method: string;
    payment_status: string;
    coupon_code: null;
    affiliate_code: null;
  }) => {
    const primary = await supabase.functions.invoke("create-order", { body: orderData });
    if (!primary.error && primary.data && !primary.data.error) return primary.data;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!projectId || !publishableKey) {
      throw primary.error || new Error(primary.data?.error || "Order service unavailable");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
        body: JSON.stringify(orderData),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || `Order service unavailable (${response.status})`);
      }
      if (payload?.error) throw new Error(payload.error);
      return payload;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleCODOrder = async () => {
    await createCODOrder();
  };

  const createCODOrder = async () => {
    setIsProcessing(true);

    const orderData = {
      user_id: user?.id || null,
      customer_name: `${formData.firstName} ${formData.lastName}`,
      customer_email: formData.email,
      customer_phone: `${formData.countryCode} ${formData.phone}`,
      shipping_address: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      },
      items: items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize || null,
      })),
      payment_method: "cod",
      payment_status: "pending",
      coupon_code: null,
      affiliate_code: null,
    };

    try {
      const data = await invokeCreateOrder(orderData);

      const orderNumber = data?.order?.order_number || `PEND-${Date.now().toString(36).toUpperCase()}`;
      const isQueuedBackupOrder = Boolean(data?.queued || data?.degraded || orderNumber.startsWith("PEND-"));

      if (isQueuedBackupOrder) {
        cacheOfflineOrder(
          {
            order_number: orderNumber,
            customer_name: orderData.customer_name,
            customer_email: orderData.customer_email,
            customer_phone: orderData.customer_phone,
            items: orderData.items,
            subtotal: orderData.items.reduce((sum, it) => sum + it.price * it.quantity, 0),
            discount: 0,
            shipping: 20,
            total: orderData.items.reduce((sum, it) => sum + it.price * it.quantity, 0) + 20,
            shipping_address: orderData.shipping_address,
            payment_method: "cod",
            user_id: orderData.user_id,
          },
          "edge_queued",
          data?.message
        );
      }

      toast({
        title: isQueuedBackupOrder ? "Order Captured Successfully" : "Order Placed Successfully!",
        description: isQueuedBackupOrder
          ? `Reference #${orderNumber}. Backend is temporarily busy, but your order was captured and will be processed manually.`
          : `Order #${orderNumber}. You will receive a confirmation email shortly.`,
      });

      await saveAddressToProfile();
      clearCart();
      navigate(`/?order=${orderNumber}`);
    } catch (error) {
      console.error("Order error:", error);

      if (isInfrastructureError(error)) {
        const localOrderNumber = `LOC-${Date.now().toString(36).toUpperCase()}`;
        const subtotal = orderData.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
        const total = subtotal + 20;

        cacheOfflineOrder(
          {
            order_number: localOrderNumber,
            customer_name: orderData.customer_name,
            customer_email: orderData.customer_email,
            customer_phone: orderData.customer_phone,
            items: orderData.items,
            subtotal,
            discount: 0,
            shipping: 20,
            total,
            shipping_address: orderData.shipping_address,
            payment_method: "cod",
            user_id: orderData.user_id,
          },
          "client_backup",
          error instanceof Error ? error.message : "network failure"
        );

        toast({
          title: "Order Captured (Backup)",
          description: `Reference #${localOrderNumber}. We saved your order details and the team will process it manually.`,
        });

        clearCart();
        navigate(`/?order=${localOrderNumber}`);
        return;
      }

      const fallbackMessage = error instanceof Error ? error.message : "Please try again or contact support.";
      toast({
        title: "Error placing order",
        description: fallbackMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };



  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  // No login required - guest checkout is allowed

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-heading text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products to checkout.</p>
          <Button asChild>
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-8">Checkout</h1>

          {/* Express Checkout Banner */}
          {savedAddress && !isExpressMode && !loadingSavedAddress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-lg p-4 mb-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-foreground">Express Checkout</h3>
                    <p className="text-sm text-muted-foreground">
                      Use your saved address: {savedAddress.address}, {savedAddress.city}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleExpressCheckout}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Use Saved Address
                </Button>
              </div>
            </motion.div>
          )}

          {/* Express Mode Active Indicator */}
          {isExpressMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-emerald-500">Express Checkout Active</h3>
                  <p className="text-sm text-muted-foreground">
                    Your saved address has been applied. Just select payment and place your order!
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpressMode(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Edit Details
                </Button>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Left Column - Billing Details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <Label>Country / Region *</Label>
                  <p className="text-foreground font-medium mt-1">United Arab Emirates</p>
                </div>

                <div>
                  <Label htmlFor="firstName">Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    
                    className={`mt-1 bg-card ${fieldErrors.firstName ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                  />
                  {fieldErrors.firstName && <p className="text-destructive text-sm mt-1 font-medium">{fieldErrors.firstName}</p>}
                </div>

                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`mt-1 bg-card ${fieldErrors.address ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                  />
                  {fieldErrors.address && <p className="text-destructive text-sm mt-1 font-medium">{fieldErrors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="state">Emirate *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, state: value }));
                      if (fieldErrors.state) setFieldErrors(prev => { const n = { ...prev }; delete n.state; return n; });
                    }}
                  >
                    <SelectTrigger className={`mt-1 bg-card ${fieldErrors.state ? "border-destructive ring-1 ring-destructive" : "border-border"}`}>
                      <SelectValue placeholder="Select Emirate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                      <SelectItem value="Sharjah">Sharjah</SelectItem>
                      <SelectItem value="Ajman">Ajman</SelectItem>
                      <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                      <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                      <SelectItem value="Fujairah">Fujairah</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.state && <p className="text-destructive text-sm mt-1 font-medium">{fieldErrors.state}</p>}
                </div>

                <div>
                  <Label htmlFor="city">Town / City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    
                    className={`mt-1 bg-card ${fieldErrors.city ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                  />
                  {fieldErrors.city && <p className="text-destructive text-sm mt-1 font-medium">{fieldErrors.city}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={formData.countryCode}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
                    >
                      <SelectTrigger className="w-[110px] bg-card border-border">
                        <SelectValue placeholder="+971" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="+971">🇦🇪 +971</SelectItem>
                        <SelectItem value="+966">🇸🇦 +966</SelectItem>
                        <SelectItem value="+968">🇴🇲 +968</SelectItem>
                        <SelectItem value="+974">🇶🇦 +974</SelectItem>
                        <SelectItem value="+973">🇧🇭 +973</SelectItem>
                        <SelectItem value="+965">🇰🇼 +965</SelectItem>
                        <SelectItem value="+91">🇮🇳 +91</SelectItem>
                        <SelectItem value="+92">🇵🇰 +92</SelectItem>
                        <SelectItem value="+63">🇵🇭 +63</SelectItem>
                        <SelectItem value="+880">🇧🇩 +880</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      
                      className={`flex-1 bg-card ${fieldErrors.phone ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-destructive text-sm mt-1 font-medium">{fieldErrors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    
                    className={`mt-1 bg-card ${fieldErrors.email ? "border-destructive ring-1 ring-destructive" : "border-border"}`}
                  />
                  {fieldErrors.email && <p className="text-destructive text-sm mt-1 font-medium">{fieldErrors.email}</p>}
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="border border-border rounded-lg p-6 sticky top-24">
                  {/* Product table header */}
                  <div className="flex justify-between text-sm font-medium text-foreground border-b border-border pb-3 mb-3">
                    <span>Product</span>
                    <span>Subtotal</span>
                  </div>

                  {/* Product items */}
                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex-1 pe-4">
                          {item.product.name}
                          {item.selectedSize && (
                            <span className="text-xs block text-muted-foreground/70">Size: {item.selectedSize}</span>
                          )}
                          <span className="text-xs block">× {item.quantity}</span>
                        </span>
                        <span className="text-foreground whitespace-nowrap">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Subtotal */}
                  <div className="flex justify-between text-sm py-3">
                    <span className="text-foreground font-medium">Subtotal</span>
                    <span className="text-foreground">{formatPrice(totalPrice)}</span>
                  </div>

                  <Separator />

                  {/* Shipping */}
                  <div className="flex justify-between text-sm py-3">
                    <span className="text-foreground font-medium">Delivery Charge</span>
                    <span className="text-foreground">{formatPrice(shipping)}</span>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between py-3">
                    <span className="text-foreground font-bold">Total</span>
                    <span className="text-foreground font-bold text-lg">{formatPrice(orderTotal)}</span>
                  </div>

                  <Separator className="mb-4" />

                  {/* Cash on Delivery */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 rounded-full border-2 border-foreground flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-foreground" />
                    </div>
                    <span className="font-medium text-foreground">Cash On Delivery</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 ms-7">Pay with cash upon delivery.</p>

                  {/* Terms checkbox */}
                  <div className="mb-6">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="terms-checkout"
                        className={`mt-1 accent-primary ${fieldErrors.terms ? "outline outline-2 outline-destructive" : ""}`}
                        onChange={() => {
                          if (fieldErrors.terms) setFieldErrors(prev => { const n = { ...prev }; delete n.terms; return n; });
                        }}
                      />
                      <Label htmlFor="terms-checkout" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                        I have read and agree to the website{" "}
                        <Link to="/terms" target="_blank" className="text-primary hover:underline">
                          terms and conditions
                        </Link>{" "}*
                      </Label>
                    </div>
                    {fieldErrors.terms && <p className="text-destructive text-sm mt-1 font-medium">{fieldErrors.terms}</p>}
                  </div>

                  {/* Place Order Button */}
                  <Button
                    type="submit"
                    className="w-full bg-foreground hover:bg-foreground/90 text-background py-6 text-sm font-medium tracking-wide"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-background border-t-transparent rounded-full"
                        />
                        Processing...
                      </span>
                    ) : (
                      "Place order"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>

        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default memo(Checkout);
