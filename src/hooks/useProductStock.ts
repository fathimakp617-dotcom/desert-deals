import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductStock {
  id: string;
  stock_quantity: number;
  is_active: boolean;
}

export const useProductStock = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["product-stock"],
    queryFn: async () => {
      // Try to derive stock from already-cached product list to avoid extra query
      const cachedProducts = queryClient.getQueryData<any[]>(["db-products"]);
      if (cachedProducts && cachedProducts.length > 0) {
        const stockMap: Record<string, ProductStock> = {};
        // db-products doesn't have stock_quantity directly, so we still need to fetch
        // But we can use a lighter query
      }

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
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
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
