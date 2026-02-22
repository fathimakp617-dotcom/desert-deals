import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, products as staticProducts } from "@/data/products";
import { useCallback } from "react";

// Create a lookup map from static data for enrichment
const staticEnrichmentMap = new Map<string, Product>();
staticProducts.forEach((p) => staticEnrichmentMap.set(p.id, p));

interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  stock_quantity: number;
  category: string | null;
  size: string | null;
  image_url: string | null;
  is_active: boolean | null;
  notes: { top?: string[]; middle?: string[]; base?: string[] } | null;
  created_at: string;
}

const mapDbToProduct = (db: DbProduct): Product => {
  const staticData = staticEnrichmentMap.get(db.id);

  return {
    id: db.id,
    name: db.name,
    tagline: staticData?.tagline || db.category || "Premium Footwear",
    description: db.description || staticData?.description || "",
    story: staticData?.story || db.description || "",
    price: db.price,
    originalPrice: db.original_price || db.price * 2,
    discountPercent: db.discount_percent || 0,
    category: db.category || "Unisex",
    size: db.size || "EU 40-45",
    image: db.image_url ? db.image_url.split(",")[0].trim() : (staticData?.image || ""),
    gallery: db.image_url
      ? db.image_url.split(",").map(u => u.trim()).filter(Boolean)
      : (staticData?.gallery || []),
    construction: {
      upper: db.notes?.top || staticData?.construction?.upper || [],
      midsole: db.notes?.middle || staticData?.construction?.midsole || [],
      outsole: db.notes?.base || staticData?.construction?.outsole || [],
    },
    materials: staticData?.materials || [],
    style: staticData?.style || "",
    comfort: staticData?.comfort || "",
    fit: staticData?.fit || "",
    season: staticData?.season || [],
    occasion: staticData?.occasion || [],
  };
};

export const useDbProducts = () => {
  return useQuery({
    queryKey: ["db-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        return staticProducts;
      }

      if (!data || data.length === 0) {
        return staticProducts;
      }

      return (data as DbProduct[]).map(mapDbToProduct);
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Gets a single product by ID, using cached list data as initialData
 * for instant rendering when available.
 */
export const useDbProduct = (id: string | undefined) => {
  const queryClient = useQueryClient();

  // Try to find the product in already-cached list data
  const getCachedProduct = (): Product | undefined => {
    const cachedList = queryClient.getQueryData<Product[]>(["db-products"]);
    return cachedList?.find((p) => p.id === id);
  };

  return useQuery({
    queryKey: ["db-product", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching product:", error);
        return staticEnrichmentMap.get(id) || null;
      }

      if (!data) {
        return staticEnrichmentMap.get(id) || null;
      }

      return mapDbToProduct(data as DbProduct);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    initialData: getCachedProduct() ?? undefined,
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["db-products"])?.dataUpdatedAt,
  });
};

/**
 * Hook that returns a prefetch function for product detail data.
 * Call on hover/pointer-enter for instant navigation.
 */
export const usePrefetchProduct = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (productId: string) => {
      // If already cached, skip
      if (queryClient.getQueryData(["db-product", productId])) return;

      // Check list cache first
      const cachedList = queryClient.getQueryData<Product[]>(["db-products"]);
      const cached = cachedList?.find((p) => p.id === productId);
      if (cached) {
        queryClient.setQueryData(["db-product", productId], cached);
        return;
      }

      // Otherwise prefetch from DB
      queryClient.prefetchQuery({
        queryKey: ["db-product", productId],
        queryFn: async () => {
          const { data } = await supabase
            .from("products")
            .select("*")
            .eq("id", productId)
            .maybeSingle();
          if (data) return mapDbToProduct(data as DbProduct);
          return staticEnrichmentMap.get(productId) || null;
        },
        staleTime: 2 * 60 * 1000,
      });
    },
    [queryClient]
  );
};
