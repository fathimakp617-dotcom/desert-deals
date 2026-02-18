import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CouponData {
  code: string;
  discountPercent: number;
  discountAmount: number | null;
  minOrderAmount: number;
  freeShipping?: boolean;
}

interface CouponContextType {
  appliedCoupon: CouponData | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  calculateDiscount: (subtotal: number) => number;
  isLoading: boolean;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export const CouponProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-apply welcome coupon for new signups
  useEffect(() => {
    const autoApplyWelcomeCoupon = async () => {
      const welcomeCoupon = localStorage.getItem("rayn_welcome_coupon");
      if (welcomeCoupon && user && !appliedCoupon) {
        const result = await applyCoupon(welcomeCoupon);
        if (result.success) {
          localStorage.removeItem("rayn_welcome_coupon");
        }
      }
    };
    autoApplyWelcomeCoupon();
  }, [user]);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!code.trim()) {
      return { success: false, message: "Please enter a coupon code" };
    }

    setIsLoading(true);
    try {
      const { data: couponData, error: couponError } = await supabase
        .rpc('validate_coupon_code', { coupon_code: code.toUpperCase() });

      if (couponData && couponData.length > 0 && !couponError) {
        const coupon = couponData[0];
        
        if (!coupon.is_valid) {
          setIsLoading(false);
          return { success: false, message: "This coupon has expired or reached its usage limit" };
        }

        setAppliedCoupon({
          code: coupon.code,
          discountPercent: coupon.discount_percent,
          discountAmount: coupon.discount_amount,
          minOrderAmount: coupon.min_order_amount || 0,
          freeShipping: coupon.free_shipping || false,
        });
        setCouponCode(coupon.code);
        setIsLoading(false);
        const freeShippingText = coupon.free_shipping ? " + Free Shipping!" : "";
        return { success: true, message: `Coupon applied! ${coupon.discount_percent}% off${freeShippingText}` };
      }

      setIsLoading(false);
      return { success: false, message: "Invalid coupon code" };
    } catch (error) {
      setIsLoading(false);
      return { success: false, message: "Error applying coupon" };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const calculateDiscount = (subtotal: number): number => {
    if (!appliedCoupon) return 0;
    if (subtotal < appliedCoupon.minOrderAmount) return 0;
    if (appliedCoupon.discountAmount) {
      return appliedCoupon.discountAmount;
    }
    return (subtotal * appliedCoupon.discountPercent) / 100;
  };

  return (
    <CouponContext.Provider
      value={{
        appliedCoupon,
        couponCode,
        setCouponCode,
        applyCoupon,
        removeCoupon,
        calculateDiscount,
        isLoading,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};

export const useCoupon = () => {
  const context = useContext(CouponContext);
  if (context === undefined) {
    throw new Error("useCoupon must be used within a CouponProvider");
  }
  return context;
};
