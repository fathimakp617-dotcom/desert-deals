import { useState, useEffect, memo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Truck, Check, Lock, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";

import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { usePinCodeLookup } from "@/hooks/usePinCodeLookup";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShippingTermsDialog from "@/components/ShippingTermsDialog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

const Checkout = () => {
  const { items, totalPrice, clearCart, totalItems } = useCart();
  
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [isExpressMode, setIsExpressMode] = useState(false);
  const [loadingSavedAddress, setLoadingSavedAddress] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United Arab Emirates",
    orderNotes: "",
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
                address: pendingNormalized.address,
                city: pendingNormalized.city,
                state: pendingNormalized.state || "",
                zipCode: pendingNormalized.zipCode || "",
                country: "United Arab Emirates",
                orderNotes: "",
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
            address: normalized.address,
            city: normalized.city,
            state: normalized.state || "",
            zipCode: normalized.zipCode || "",
            country: "United Arab Emirates",
            orderNotes: "",
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
        zipCode: formData.zipCode,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Show terms dialog instead of directly processing
    setShowTermsDialog(true);
  };

  const handleConfirmOrder = async () => {
    setShowTermsDialog(false);
    if (paymentMethod === "upi" || paymentMethod === "card") {
      await handleRazorpayPayment(paymentMethod);
    } else {
      await handleCODOrder();
    }
  };

  const handleCODOrder = async () => {
    // For now, allow all COD orders without shipping prepayment
    // TODO: Enable Razorpay shipping prepayment when ready
    await createCODOrder(false);
  };

  const createCODOrder = async (shippingPaid = false) => {
    setIsProcessing(true);

    try {
      const orderData = {
        user_id: user?.id || null,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        payment_method: "cod",
        payment_status: shippingPaid ? "shipping_paid" : "pending",
        coupon_code: null,
        affiliate_code: null,
      };

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData,
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Order Placed Successfully!",
        description: shippingPaid 
          ? `Order #${data.order.order_number}. Shipping paid - we'll dispatch your order soon!` 
          : `Order #${data.order.order_number}. You will receive a confirmation email shortly.`,
      });

      // Save address for future express checkout
      await saveAddressToProfile();
      
      clearCart();
      navigate(`/?order=${data.order.order_number}`);
    } catch (error) {
      console.error("Order error:", error);
      toast({
        title: "Error placing order",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCODShippingPayment = async () => {
    setIsProcessing(true);

    try {
      // Create Razorpay order for shipping charge only
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: shipping,
          currency: "INR",
          receipt: `cod_shipping_${Date.now()}`,
          notes: {
            customer_email: formData.email,
            customer_name: `${formData.firstName} ${formData.lastName}`,
            payment_type: "cod_shipping",
          },
        },
      });

      if (orderError || !orderData?.success) {
        throw new Error(orderData?.error || "Failed to create shipping payment order");
      }

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Desert Deal",
        description: "COD Shipping Charge",
        image: "https://uyrudydfpbisawgsepxd.supabase.co/storage/v1/object/public/assets/logo.png",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          await verifyCODShippingAndCreateOrder(response);
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
          method: "upi",
        },
        remember_customer: true,
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI",
                instruments: [
                  { method: "upi", flows: ["qrcode", "collect", "intent"] },
                  { method: "upi", apps: ["google_pay", "phonepe", "paytm"] },
                ],
              },
              cards: {
                name: "Card Payment",
                instruments: [
                  { method: "card", types: ["credit", "debit"] },
                ],
              },
            },
            sequence: ["block.upi", "block.cards"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: "#a87c39",
          backdrop_color: "rgba(28, 28, 28, 0.95)",
          hide_topbar: false,
        },
        modal: {
          confirm_close: true,
          escape: false,
          animation: true,
          backdropclose: false,
          ondismiss: () => {
            setIsProcessing(false);
            toast({
              title: "Shipping Payment Cancelled",
              description: "Please pay the shipping charge to place your COD order.",
              variant: "destructive",
            });
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("COD Shipping payment error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate shipping payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const verifyCODShippingAndCreateOrder = async (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      // Verify the shipping payment
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          is_shipping_only: true, // Flag to indicate this is just shipping verification
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Shipping payment verification failed");
      }

      toast({
        title: "Shipping Paid!",
        description: "Creating your COD order...",
      });

      // Now create the COD order with shipping marked as paid
      await createCODOrder(true);
    } catch (error) {
      console.error("Shipping verification error:", error);
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support with your payment details.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async (method: "upi" | "card" = "upi") => {
    setIsProcessing(true);

    try {
      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: orderTotal,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            customer_email: formData.email,
            customer_name: `${formData.firstName} ${formData.lastName}`,
          },
        },
      });

      if (orderError || !orderData?.success) {
        throw new Error(orderData?.error || "Failed to create payment order");
      }

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const isUPI = method === "upi";
      const contactDigits = (formData.phone || "").replace(/\D/g, "");

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Desert Deal",
        description: isUPI ? "UPI Payment - Desert Deal" : "Card/Netbanking - Desert Deal",
        image: "https://uyrudydfpbisawgsepxd.supabase.co/storage/v1/object/public/assets/logo.png",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          await verifyAndCompleteOrder(response);
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: contactDigits,
        },
        // Enable saved cards/tokens
        remember_customer: true,
        // Keep fallback methods enabled to avoid "no appropriate payment method found".
        // We only *prioritize* UPI in the UI when the user selects it.
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          paylater: false,
        },
        config: {
          display: {
            hide: [{ method: "paylater" }],
            blocks: {
              upi: {
                name: "UPI",
                instruments: [{ method: "upi" }],
              },
              cards: {
                name: "Cards",
                instruments: [{ method: "card" }],
              },
              banks: {
                name: "Netbanking",
                instruments: [{ method: "netbanking" }],
              },
            },
            sequence: isUPI
              ? ["block.upi", "block.cards", "block.banks"]
              : ["block.cards", "block.banks", "block.upi"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        theme: {
          color: "#a87c39",
          backdrop_color: "rgba(28, 28, 28, 0.95)",
          hide_topbar: false,
        },
        modal: {
          confirm_close: true,
          escape: false,
          animation: true,
          backdropclose: false,
          ondismiss: () => {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "Your payment was cancelled. You can try again.",
              variant: "destructive",
            });
          },
        },
        readonly: {
          contact: false,
          email: false,
        },
        send_sms_hash: true,
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (resp: any) => {
        const msg = resp?.error?.description || resp?.error?.reason || "Payment failed. Please try again.";
        console.error("Razorpay payment.failed:", resp);
        toast({
          title: resp?.error?.code || "Payment Failed",
          description: msg,
          variant: "destructive",
        });
      });
      razorpay.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  };

  const verifyAndCompleteOrder = async (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          order_data: {
            user_id: user?.id || null,
            customer_name: `${formData.firstName} ${formData.lastName}`,
            customer_email: formData.email,
            customer_phone: formData.phone,
            shipping_address: {
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              country: formData.country,
            },
            items: items.map(item => ({
              productId: item.product.id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
            coupon_code: null,
            affiliate_code: null,
          },
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Payment verification failed");
      }

      toast({
        title: "Payment Successful!",
        description: `Order #${data.order.order_number}. You will receive a confirmation email shortly.`,
      });

      // Save address for future express checkout
      await saveAddressToProfile();
      
      clearCart();
      navigate(`/?order=${data.order.order_number}`);
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support with your payment details.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading while checking auth
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

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Left Column - Billing Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 bg-input border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 bg-input border-border"
                    />
                  </div>
                </div>

                <div>
                  <Label>Country / Region *</Label>
                  <p className="text-foreground font-medium mt-1">United Arab Emirates</p>
                </div>

                <div>
                  <Label htmlFor="address">Street address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House number and street name"
                    required
                    className="mt-1 bg-input border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="city">Town / City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="mt-1 bg-input border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State / County (optional)</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1 bg-input border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="mt-1 bg-input border-border"
                  />
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
                    required
                    className="mt-1 bg-input border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="orderNotes">Order notes (optional)</Label>
                  <textarea
                    id="orderNotes"
                    name="orderNotes"
                    value={formData.orderNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderNotes: e.target.value }))}
                    placeholder="Notes about your order, e.g. special notes for delivery."
                    className="mt-1 w-full min-h-[100px] rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
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
                        <span className="text-muted-foreground flex-1 pr-4">
                          {item.product.name}
                          <br />
                          <span className="text-xs">× {item.quantity}</span>
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
                    <span className="text-foreground font-medium">Shipment 1</span>
                    <span className="text-foreground">Cash On Delivery: {formatPrice(shipping)}</span>
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
                  <p className="text-sm text-muted-foreground mb-6 ml-7">Pay with cash upon delivery.</p>

                  {/* Terms checkbox */}
                  <div className="flex items-start gap-2 mb-6">
                    <input
                      type="checkbox"
                      id="terms-checkout"
                      required
                      className="mt-1 accent-primary"
                    />
                    <Label htmlFor="terms-checkout" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                      I have read and agree to the website{" "}
                      <Link to="/terms" target="_blank" className="text-primary hover:underline">
                        terms and conditions
                      </Link>{" "}*
                    </Label>
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

          {/* Shipping Terms Dialog */}
          <ShippingTermsDialog
            open={showTermsDialog}
            onOpenChange={setShowTermsDialog}
            onConfirm={handleConfirmOrder}
            paymentMethod={paymentMethod}
            shippingCharge={shipping}
          />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default memo(Checkout);
