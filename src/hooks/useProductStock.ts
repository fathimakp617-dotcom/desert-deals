import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductStock {
  id: string;
  stock_quantity: number;
  is_active: boolean;
}

/**
 * Fetches stock data for all products.
 * Uses a long stale time and no polling to minimize network requests.
 * Stock is only needed for display ("In Stock" / "Sold Out") so slight staleness is fine.
 */
export const useProductStock = () => {
  return useQuery({
    queryKey: ["product-stock"],
    queryFn: async () => {
      // Only fetch products with 0 stock (sold out) — much smaller payload
      const { data, error } = await supabase
        .from("products")
        .select("id, stock_quantity, is_active")
        .eq("is_active", true)
        .eq("stock_quantity", 0);

      if (error) {
        console.error("Error fetching product stock:", error);
        return {};
      }

      const stockMap: Record<string, ProductStock> = {};
      data?.forEach((product) => {
        stockMap[product.id] = product;
      });

      return stockMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const isProductSoldOut = (
  stockMap: Record<string, ProductStock> | undefined,
  productId: string
): boolean => {
  if (!stockMap) return false;
  // If the product is in the map, it's sold out (we only fetch stock_quantity=0)
  return !!stockMap[productId];
};

export const getProductStock = (
  stockMap: Record<string, ProductStock> | undefined,
  productId: string
): number => {
  if (!stockMap) return 100;
  // If in map, it's sold out
  if (stockMap[productId]) return 0;
  // Otherwise assume in stock
  return 100;
};
