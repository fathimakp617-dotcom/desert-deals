import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductStock {
  id: string;
  stock_quantity: number;
  is_active: boolean;
}

export const useProductStock = () => {
  return useQuery({
    queryKey: ["product-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, stock_quantity, is_active");

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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const isProductSoldOut = (
  stockMap: Record<string, ProductStock> | undefined,
  productId: string
): boolean => {
  if (!stockMap || !stockMap[productId]) return false;
  return stockMap[productId].stock_quantity === 0;
};

export const getProductStock = (
  stockMap: Record<string, ProductStock> | undefined,
  productId: string
): number => {
  if (!stockMap || !stockMap[productId]) return 100;
  return stockMap[productId].stock_quantity;
};
