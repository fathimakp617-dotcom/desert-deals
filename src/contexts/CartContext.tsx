import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

// Bulk discount tiers
export const BULK_DISCOUNT_TIERS = [
  { minQty: 100, discountPercent: 30, label: "100+ pieces" },
  { minQty: 50, discountPercent: 20, label: "50+ pieces" },
  { minQty: 25, discountPercent: 10, label: "25+ pieces" },
] as const;

export const getBulkDiscountPercent = (totalQuantity: number): number => {
  for (const tier of BULK_DISCOUNT_TIERS) {
    if (totalQuantity >= tier.minQty) {
      return tier.discountPercent;
    }
  }
  return 0;
};

export const getNextBulkTier = (totalQuantity: number): { neededQty: number; discountPercent: number } | null => {
  // Find the next tier the customer hasn't reached yet
  const sortedTiers = [...BULK_DISCOUNT_TIERS].sort((a, b) => a.minQty - b.minQty);
  for (const tier of sortedTiers) {
    if (totalQuantity < tier.minQty) {
      return { neededQty: tier.minQty - totalQuantity, discountPercent: tier.discountPercent };
    }
  }
  return null; // Already at max tier
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  clearCart: () => void;
  buyNow: (product: Product, quantity?: number, selectedSize?: string) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
  bulkDiscountPercent: number;
  bulkDiscountAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const getCartKey = (productId: string, size?: string) => `${productId}__${size || ''}`;

  const addToCart = (product: Product, quantity = 1, selectedSize?: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.selectedSize === selectedSize);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedSize }];
    });
    // No drawer — callers handle navigation directly
  };

  const removeFromCart = (productId: string, selectedSize?: string) => {
    setItems((prev) => prev.filter((item) => !(item.product.id === productId && item.selectedSize === selectedSize)));
  };

  const updateQuantity = (productId: string, quantity: number, selectedSize?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.selectedSize === selectedSize ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const buyNow = (product: Product, quantity = 1, selectedSize?: string) => {
    setItems([{ product, quantity, selectedSize }]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  const bulkDiscountPercent = getBulkDiscountPercent(totalItems);
  const bulkDiscountAmount = Math.round(totalPrice * (bulkDiscountPercent / 100));

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        buyNow,
        isOpen,
        openCart,
        closeCart,
        totalItems,
        totalPrice,
        bulkDiscountPercent,
        bulkDiscountAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
