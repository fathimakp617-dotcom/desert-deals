import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createTimeoutSignal } from "@/lib/supabaseTimeout";

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
      // Reuse cached db-products data if available to avoid an extra network call
      const cachedProducts = queryClient.getQueryData<any[]>(["db-products"]);
      if (cachedProducts && cachedProducts.length > 0) {
        // db-products already fetches stock_quantity — reuse it
        const stockMap: Record<string, ProductStock> = {};
        cachedProducts.forEach((p: any) => {
          if (p._stock != null) {
            stockMap[p.id] = { id: p.id, stock_quantity: p._stock, is_active: true };
          }
        });
        if (Object.keys(stockMap).length > 0) return stockMap;
      }

      const { signal, clear } = createTimeoutSignal(5000);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, stock_quantity, is_active")
          .eq("is_active", true)
          .is("deleted_at", null)
          .abortSignal(signal);

        if (error) {
          console.error("Error fetching product stock:", error);
          return {};
        }
        return data?.reduce((map, product) => {
          map[product.id] = product;
          return map;
        }, {} as Record<string, ProductStock>) || {};
      } catch {
        return {};
      } finally {
        clear();
      }

      const stockMap: Record<string, ProductStock> = {};
      data?.forEach((product) => {
        stockMap[product.id] = product;
      });

      return stockMap;
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
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
