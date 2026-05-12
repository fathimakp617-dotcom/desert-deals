import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import type { Product } from "@/data/products";

// Stub Supabase client used by CartContext for analytics fire-and-forget.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

const makeProduct = (id: string, name = "Test Shoe"): Product => ({
  id,
  name,
  tagline: "",
  description: "",
  story: "",
  price: 200,
  originalPrice: 400,
  discountPercent: 50,
  category: "All Shoes",
  size: "EU 36, EU 47",
  image: "",
  gallery: [],
  construction: { upper: [], midsole: [], outsole: [] },
  materials: [],
  style: "",
  comfort: "",
  fit: "",
  season: [],
  occasion: [],
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("CartContext with EU 47", () => {
  it("keeps EU 47 as a separate cart line from EU 46 for the same product", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const p = makeProduct("p1");

    act(() => {
      result.current.addToCart(p, 1, "EU 46");
      result.current.addToCart(p, 2, "EU 47");
    });

    expect(result.current.items).toHaveLength(2);
    const eu47 = result.current.items.find((i) => i.selectedSize === "EU 47");
    expect(eu47?.quantity).toBe(2);
    expect(result.current.totalItems).toBe(3);
    expect(result.current.totalPrice).toBe(600);
  });

  it("merges quantity when adding the same EU 47 line again", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const p = makeProduct("p1");

    act(() => {
      result.current.addToCart(p, 1, "EU 47");
      result.current.addToCart(p, 4, "EU 47");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.items[0].selectedSize).toBe("EU 47");
  });

  it("updateQuantity and removeFromCart target the EU 47 line specifically", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const p = makeProduct("p1");

    act(() => {
      result.current.addToCart(p, 2, "EU 46");
      result.current.addToCart(p, 2, "EU 47");
      result.current.updateQuantity("p1", 5, "EU 47");
    });
    expect(
      result.current.items.find((i) => i.selectedSize === "EU 47")?.quantity
    ).toBe(5);
    expect(
      result.current.items.find((i) => i.selectedSize === "EU 46")?.quantity
    ).toBe(2);

    act(() => {
      result.current.removeFromCart("p1", "EU 47");
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].selectedSize).toBe("EU 46");
  });

  it("buyNow with EU 47 replaces the cart with a single line", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const p1 = makeProduct("p1");
    const p2 = makeProduct("p2", "Other");

    act(() => {
      result.current.addToCart(p1, 3, "EU 40");
      result.current.buyNow(p2, 1, "EU 47");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.id).toBe("p2");
    expect(result.current.items[0].selectedSize).toBe("EU 47");
  });
});
