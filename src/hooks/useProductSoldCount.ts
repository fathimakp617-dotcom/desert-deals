import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProductSoldCount = (productId: string | undefined) => {
  return useQuery({
    queryKey: ["product-sold-count", productId],
    queryFn: async () => {
      if (!productId) return 0;

      const { data, error } = await supabase
        .from("orders")
        .select("items")
        .in("order_status", ["pending", "confirmed", "processing", "shipped", "delivered"]);

      if (error) {
        console.error("Error fetching sold count:", error);
        return 0;
      }

      let count = 0;
      (data || []).forEach((order) => {
        const items = order.items as any[];
        if (Array.isArray(items)) {
          items.forEach((item) => {
            if (item.productId === productId) {
              count += item.quantity || 1;
            }
          });
        }
      });

      return count;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
};
