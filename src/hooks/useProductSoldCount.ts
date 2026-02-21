import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Generate a consistent pseudo-random number from a string seed */
const seededRandom = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

export const useProductSoldCount = (productId: string | undefined) => {
  return useQuery({
    queryKey: ["product-sold-count", productId],
    queryFn: async () => {
      if (!productId) return 0;

      const { data, error } = await supabase
        .from("orders")
        .select("items")
        .in("order_status", ["pending", "confirmed", "processing", "shipped", "delivered"]);

      let realCount = 0;
      if (!error && data) {
        (data || []).forEach((order) => {
          const items = order.items as any[];
          if (Array.isArray(items)) {
            items.forEach((item) => {
              if (item.productId === productId) {
                realCount += item.quantity || 1;
              }
            });
          }
        });
      }

      // Add a unique base number per product (15-95 range) so each product looks different
      const base = (seededRandom(productId) % 81) + 15;
      return realCount + base;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
};
