import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, products as staticProducts } from "@/data/products";
import { useCallback, useEffect } from "react";

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
    image: db.image_url ? db.image_url.split(",")[0].trim() : staticData?.image || "",
    gallery: db.image_url
      ? db.image_url
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean)
      : staticData?.gallery || [],
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
const SKIP_LISTED_PRODUCTS_COUNT = 100;
const INITIAL_BATCH_SIZE = 200;
const HYDRATION_BATCH_SIZE = 800;
const BACKGROUND_BATCH_DELAY_MS = 30;

const fetchProductBatch = async (from: number, to: number): Promise<DbProduct[]> => {
  // Race the backend query against a hard timeout
  const controller = new AbortController();
  const abortTimeout = setTimeout(() => controller.abort(), 5000);

  const queryPromise = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to)
    .abortSignal(controller.signal);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Query timed out after 5s")), 5500)
  );

  try {
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    if (error) throw new Error(`Batch ${from}-${to}: ${error.message}`);
    return (data || []) as DbProduct[];
  } finally {
    clearTimeout(abortTimeout);
  }
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

const stripHtml = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
};

const slugify = (name: string, wooId: string): string => {
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80);
  return slug || `product-${wooId}`;
};

const extractCategory = (cats: string): string => {
  if (!cats) return "All Shoes";
  const parts = cats
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const brand = parts.find((p) => p !== "All Shoes" && p !== "Uncategorized");
  return brand || parts[0] || "All Shoes";
};

const extractFirstImage = (images: string): string => {
  if (!images) return "";
  return images.split(",")[0]?.trim() || "";
};

const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        currentField += ch;
        i++;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ",") {
      currentRow.push(currentField);
      currentField = "";
      i++;
      continue;
    }

    if (ch === "\n" || (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n")) {
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.length > 1) rows.push(currentRow);
      currentRow = [];
      i += ch === "\r" ? 2 : 1;
      continue;
    }

    if (ch === "\r") {
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.length > 1) rows.push(currentRow);
      currentRow = [];
      i++;
      continue;
    }

    currentField += ch;
    i++;
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1) rows.push(currentRow);
  }

  return rows;
};

const parseWooCommerceCSVToDbProducts = (text: string): DbProduct[] => {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const colIndex = (name: string): number => headers.findIndex((h) => h.trim() === name);

  const iID = colIndex("ID");
  const iType = colIndex("Type");
  const iSKU = colIndex("SKU");
  const iName = colIndex("Name");
  const iDesc = colIndex("Description");
  const iShortDesc = colIndex("Short description");
  const iInStock = colIndex("In stock?");
  const iStock = colIndex("Stock");
  const iSalePrice = colIndex("Sale price");
  const iRegPrice = colIndex("Regular price");
  const iCategories = colIndex("Categories");
  const iImages = colIndex("Images");
  const iAttr1Name = colIndex("Attribute 1 name");
  const iAttr1Values = colIndex("Attribute 1 value(s)");

  const products: DbProduct[] = [];
  const seenIds = new Set<string>();

  let currentParent: {
    wooId: string;
    sku: string;
    name: string;
    description: string;
    categories: string;
    images: string;
    sizes: string;
    inStock: boolean;
    stockQty: number;
  } | null = null;

  let parentPrice = 0;
  let parentOrigPrice = 0;
  let gotPriceFromVariation = false;

  const flushParent = () => {
    if (!currentParent) return;

    const id = currentParent.sku ? currentParent.sku : slugify(currentParent.name, currentParent.wooId);
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const price = parentPrice || 0;
    if (price <= 0) return;

    const originalPrice = parentOrigPrice > 0 ? parentOrigPrice : price * 2;
    const discountPercent = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    products.push({
      id,
      name: currentParent.name,
      description: stripHtml(currentParent.description).substring(0, 2000) || null,
      price,
      original_price: originalPrice,
      discount_percent: discountPercent,
      stock_quantity: currentParent.stockQty || 50,
      category: extractCategory(currentParent.categories),
      size: currentParent.sizes ? `EU ${currentParent.sizes}` : "EU 36-45",
      image_url: extractFirstImage(currentParent.images) || null,
      is_active: currentParent.inStock,
      notes: { top: [], middle: [], base: [] },
      created_at: new Date(0).toISOString(),
      cross_sell_price: null,
    });
  };

  const getCol = (row: string[], idx: number): string => (idx >= 0 && idx < row.length ? row[idx] : "");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const type = getCol(row, iType).trim();
    const wooId = getCol(row, iID).trim();
    const sku = getCol(row, iSKU).trim();
    const name = getCol(row, iName).trim();
    const description = getCol(row, iDesc) || getCol(row, iShortDesc) || "";
    const inStock = getCol(row, iInStock).trim();
    const stockQty = getCol(row, iStock).trim();
    const salePrice = getCol(row, iSalePrice).trim();
    const regularPrice = getCol(row, iRegPrice).trim();
    const categories = getCol(row, iCategories).trim();
    const images = getCol(row, iImages).trim();

    const attr1Name = getCol(row, iAttr1Name).trim().toLowerCase();
    const attr1Values = getCol(row, iAttr1Values).trim();
    const sizeValues = attr1Name === "size" || attr1Name === "shoe size" ? attr1Values : "";

    if (type === "variable") {
      flushParent();

      currentParent = {
        wooId,
        sku,
        name,
        description,
        categories,
        images,
        sizes: sizeValues.replace(/\s/g, ""),
        inStock: inStock !== "0",
        stockQty: parseInt(stockQty) || 50,
      };

      parentPrice = parseFloat(salePrice) || 0;
      parentOrigPrice = parseFloat(regularPrice) || 0;
      gotPriceFromVariation = false;
      continue;
    }

    if (type === "variation" && currentParent && !gotPriceFromVariation) {
      const vSale = parseFloat(salePrice);
      const vReg = parseFloat(regularPrice);
      if (vSale > 0 || vReg > 0) {
        parentPrice = vSale > 0 ? vSale : parentPrice;
        parentOrigPrice = vReg > 0 ? vReg : parentOrigPrice;
        gotPriceFromVariation = true;
      }
    }
  }

  flushParent();
  return products;
};

let backgroundHydrationInFlight: Promise<void> | null = null;
let offlineCatalogCache: Product[] | null = null;
let offlineCatalogPromise: Promise<Product[]> | null = null;

const hydrateRemainingProductsInBackground = async (queryClient: ReturnType<typeof useQueryClient>) => {
  let from = SKIP_LISTED_PRODUCTS_COUNT + INITIAL_BATCH_SIZE;

  while (true) {
    const to = from + HYDRATION_BATCH_SIZE - 1;

    let batch: DbProduct[] = [];
    try {
      batch = await fetchProductBatch(from, to);
    } catch {
      // Never block UI on background hydration errors
      break;
    }

    if (!batch.length) break;

    const mappedBatch = mapDbListToProducts(batch);
    queryClient.setQueryData<Product[]>(["db-products"], (prev) => mergeUniqueProducts(prev || [], mappedBatch));

    if (batch.length < HYDRATION_BATCH_SIZE) break;

    from += HYDRATION_BATCH_SIZE;
    await new Promise((resolve) => setTimeout(resolve, BACKGROUND_BATCH_DELAY_MS));
  }
};

const loadOfflineCatalogFromCsv = async (): Promise<Product[]> => {
  if (offlineCatalogCache) return offlineCatalogCache;
  if (offlineCatalogPromise) return offlineCatalogPromise;

  offlineCatalogPromise = (async () => {
    const response = await fetch("/data/wc-product-export.csv", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load offline catalog (${response.status})`);
    }

    const text = await response.text();
    const parsedRows = parseWooCommerceCSVToDbProducts(text).filter((p) => p.is_active && p.price > 0);
    const mapped = mapDbListToProducts(parsedRows);

    offlineCatalogCache = mapped;
    return mapped;
  })().catch((error) => {
    offlineCatalogPromise = null;
    throw error;
  });

  return offlineCatalogPromise;
};

export const useDbProducts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["db-products"],
    queryFn: async () => {
      try {
        // Faster first paint: fetch a lighter first page immediately
        const firstBatch = await fetchProductBatch(0, INITIAL_BATCH_SIZE - 1);
        return mapDbListToProducts(firstBatch);
      } catch (error) {
        console.error("Primary product fetch failed:", error);

        try {
          const offlineProducts = await loadOfflineCatalogFromCsv();
          if (offlineProducts.length > 0) return offlineProducts;
        } catch (csvError) {
          console.error("Offline CSV fallback failed:", csvError);
        }

        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
    retryDelay: 2000,
  });

  useEffect(() => {
    const data = query.data;
    if (!data || data.length === 0) return;
    // Only start background hydration when initial batch is full (more may exist)
    if (data.length < INITIAL_BATCH_SIZE) return;
    if (backgroundHydrationInFlight) return;

    backgroundHydrationInFlight = hydrateRemainingProductsInBackground(queryClient).finally(() => {
      backgroundHydrationInFlight = null;
    });
  }, [query.data, queryClient]);

  return query;
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

      const cached = getCachedProduct();

      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();

      if (error) {
        console.error("Error fetching product:", error);
        return cached || staticEnrichmentMap.get(id) || null;
      }

      if (!data) {
        return cached || staticEnrichmentMap.get(id) || null;
      }

      return mapDbToProduct(data as DbProduct);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    initialData: getCachedProduct() ?? undefined,
    initialDataUpdatedAt: () => queryClient.getQueryState(["db-products"])?.dataUpdatedAt,
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
          try {
            const { data, error } = await supabase
              .from("products")
              .select("*")
              .eq("id", productId)
              .maybeSingle();

            if (error) throw error;
            if (data) return mapDbToProduct(data as DbProduct);
          } catch {
            const latestCachedList = queryClient.getQueryData<Product[]>(["db-products"]);
            const fallbackFromList = latestCachedList?.find((p) => p.id === productId);
            if (fallbackFromList) return fallbackFromList;
          }

          return staticEnrichmentMap.get(productId) || null;
        },
        staleTime: 2 * 60 * 1000,
      });
    },
    [queryClient]
  );
};
