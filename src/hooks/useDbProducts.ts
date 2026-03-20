import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, products as staticProducts } from "@/data/products";
import { useCallback, useEffect, useState } from "react";
import { withTimeout } from "@/lib/supabaseTimeout";
import { loadFallbackProducts, prewarmFallbackCache } from "@/lib/csvFallback";

// Pre-warm CSV cache at module load so fallback is instant
prewarmFallbackCache();

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
  cross_sell_price: number | null;
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
    crossSellPrice: db.cross_sell_price ?? null,
  };
};

// Progressive fetch for smooth initial render + background hydration
const PRODUCT_SELECT = "id,name,price,original_price,discount_percent,stock_quantity,category,size,image_url,cross_sell_price";
const INITIAL_BATCH_SIZE = 200;
const HYDRATION_BATCH_SIZE = 800;
const BACKGROUND_BATCH_DELAY_MS = 30;

const fetchProductBatch = async (from: number, to: number): Promise<DbProduct[]> => {
  const queryPromise = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to)
    .then((res) => res);

  const { data, error } = await withTimeout(queryPromise, 1800);

  if (error) throw new Error(`Batch ${from}-${to}: ${error.message}`);
  return (data || []) as DbProduct[];
};

const mapDbListToProducts = (rows: DbProduct[]): Product[] => {
  return rows.map((d) => {
    const p = mapDbToProduct(d);
    (p as any)._stock = d.stock_quantity;
    return p;
  });
};

const mergeUniqueProducts = (existing: Product[], incoming: Product[]): Product[] => {
  if (!incoming.length) return existing;

  const seen = new Set(existing.map((p) => p.id));
  const merged = [...existing];

  for (const product of incoming) {
    if (!seen.has(product.id)) {
      seen.add(product.id);
      merged.push(product);
    }
  }

  return merged;
};

let backgroundHydrationInFlight: Promise<void> | null = null;

const hydrateRemainingProductsInBackground = async (queryClient: ReturnType<typeof useQueryClient>) => {
  let from = INITIAL_BATCH_SIZE;

  while (true) {
    const to = from + HYDRATION_BATCH_SIZE - 1;

    let batch: DbProduct[] = [];
    try {
      batch = await fetchProductBatch(from, to);
    } catch {
      break;
    }

    if (!batch.length) break;

    const mappedBatch = mapDbListToProducts(batch);
    queryClient.setQueryData<Product[]>(["db-products"], (prev) =>
      mergeUniqueProducts(prev || [], mappedBatch)
    );

    if (batch.length < HYDRATION_BATCH_SIZE) break;

    from += HYDRATION_BATCH_SIZE;
    await new Promise((resolve) => setTimeout(resolve, BACKGROUND_BATCH_DELAY_MS));
  }
};

// Immediately start loading fallback so it's ready before the hook even mounts
let fallbackReady: Promise<Product[]> | null = null;
const getFallbackProducts = (): Promise<Product[]> => {
  if (!fallbackReady) {
    fallbackReady = loadFallbackProducts().then((products) =>
      products.length > 0 ? products : staticProducts
    );
  }
  return fallbackReady;
};

// Start loading fallback immediately at module init
getFallbackProducts();

export const useDbProducts = () => {
  const queryClient = useQueryClient();
  const [isFallback, setIsFallback] = useState(false);

  const query = useQuery({
    queryKey: ["db-products"],
    queryFn: async () => {
      // Start both DB fetch and fallback simultaneously
      const dbPromise = fetchProductBatch(0, INITIAL_BATCH_SIZE - 1).then(mapDbListToProducts);
      const fallbackPromise = getFallbackProducts();

      // Race: if DB responds within 500ms, use it; otherwise show fallback instantly
      const result = await Promise.race([
        dbPromise.then((products) => ({ source: "db" as const, products })),
        new Promise<{ source: "timeout" }>((resolve) =>
          setTimeout(() => resolve({ source: "timeout" }), 500)
        ),
      ]);

      if (result.source === "db") {
        setIsFallback(false);
        return result.products;
      }

      // DB too slow — return pre-cached fallback instantly
      setIsFallback(true);
      const fallbackProducts = await fallbackPromise;

      // Let DB finish in background and swap in silently
      dbPromise
        .then((products) => {
          setIsFallback(false);
          queryClient.setQueryData<Product[]>(["db-products"], products);
        })
        .catch(() => {
          // DB failed entirely, fallback stays
        });

      return fallbackProducts;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 0,
  });

  useEffect(() => {
    const data = query.data;
    if (!data || data.length === 0) return;
    if (isFallback) return;
    if (data.length < INITIAL_BATCH_SIZE) return;
    if (backgroundHydrationInFlight) return;

    backgroundHydrationInFlight = hydrateRemainingProductsInBackground(queryClient)
      .finally(() => {
        backgroundHydrationInFlight = null;
      });
  }, [query.data, queryClient, isFallback]);

  return { ...query, isFallback };
};

/**
 * Gets a single product by ID, using cached list data as initialData
 * for instant rendering when available.
 */
export const useDbProduct = (id: string | undefined) => {
  const queryClient = useQueryClient();

  const getCachedProduct = (): Product | undefined => {
    const cachedList = queryClient.getQueryData<Product[]>(["db-products"]);
    return cachedList?.find((p) => p.id === id);
  };

  return useQuery({
    queryKey: ["db-product", id],
    queryFn: async () => {
      if (!id) return null;

      try {
        const { data, error } = await withTimeout(
          supabase.from("products").select("*").eq("id", id).maybeSingle().then((r) => r),
          2000
        );

        if (error) {
          return getCachedProduct() || staticEnrichmentMap.get(id) || null;
        }
        if (!data) {
          return staticEnrichmentMap.get(id) || null;
        }
        return mapDbToProduct(data as DbProduct);
      } catch {
        return getCachedProduct() || staticEnrichmentMap.get(id) || null;
      }
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
      if (queryClient.getQueryData(["db-product", productId])) return;

      const cachedList = queryClient.getQueryData<Product[]>(["db-products"]);
      const cached = cachedList?.find((p) => p.id === productId);
      if (cached) {
        queryClient.setQueryData(["db-product", productId], cached);
        return;
      }

      queryClient.prefetchQuery({
        queryKey: ["db-product", productId],
        queryFn: async () => {
          try {
            const { data } = await withTimeout(
              supabase.from("products").select("*").eq("id", productId).maybeSingle().then((r) => r),
              2000
            );
            if (data) return mapDbToProduct(data as DbProduct);
          } catch {
            // timeout — skip
          }
          return staticEnrichmentMap.get(productId) || null;
        },
        staleTime: 2 * 60 * 1000,
      });
    },
    [queryClient]
  );
};
