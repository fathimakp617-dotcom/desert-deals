import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";
import { getOfflineCatalogProducts } from "@/hooks/useDbProducts";

const PAGE_SIZE = 60;
const PRODUCT_IMAGE_PLACEHOLDER = "/images/product-placeholder.jpg";
const DB_QUERY_TIMEOUT_MS = 5000;

interface DbProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  stock_quantity: number;
  category: string | null;
  size: string | null;
  image_url: string | null;
  created_at: string;
}

export interface SimpleProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  category: string;
  size: string;
  image: string;
  tagline: string;
  stockQuantity: number;
  notes: { top: string[]; heart: string[]; base: string[] };
}

interface UseInfiniteProductsOptions {
  search?: string;
  category?: string;
  sortBy?: string;
  priceMin?: number;
  priceMax?: number;
}

interface InfiniteProductsPage {
  products: SimpleProduct[];
  totalCount: number | null;
  page: number;
  pageSize: number;
}

const brandSearchTerms: Record<string, string> = {
  Nike: "Nike",
  Jordan: "Jordan",
  "New Balance": "New Balance",
  "On Cloud": "On Cloud",
  Asics: "Asics",
  Adidas: "Adidas",
  Hoka: "Hoka",
  Puma: "Puma",
  "Louis Vuitton": "Louis Vuitton",
  Gucci: "Gucci",
  "Onitsuka Tiger": "Onitsuka",
  "Loro Piana": "Loro Piana",
  Brooks: "Brooks",
  Dior: "Dior",
  Hermes: "Hermes",
  "Basketball Shoes": "Basketball",
  Watches: "Watches",
  Wallets: "Wallets",
  Sunglasses: "Sunglasses",
  Heels: "Heels",
  Rolex: "Rolex",
  Cartier: "Cartier",
  "Tom Ford": "Tom Ford",
  "Christian Louboutin": "Louboutin",
  Chanel: "Chanel",
  Goyard: "Goyard",
  Bags: "Bags",
  Socks: "Socks",
  Jersey: "Jersey",
  Kids: "Kids",
};

const excludedCategories = ["Louis Vuitton", "Socks", "Heels", "Bags", "Jersey", "Kids"];

const normalizeImageUrl = (rawUrl: string | null | undefined): string => {
  if (!rawUrl) return PRODUCT_IMAGE_PLACEHOLDER;

  const cleaned = rawUrl.trim().replace(/^"+|"+$/g, "");
  if (!cleaned) return PRODUCT_IMAGE_PLACEHOLDER;

  if (cleaned.startsWith("//")) return `https:${cleaned}`;
  if (cleaned.startsWith("http://")) return `https://${cleaned.slice(7)}`;

  return cleaned;
};

const mapProduct = (db: DbProduct): SimpleProduct => ({
  id: db.id,
  name: db.name,
  description: "",
  price: db.price,
  originalPrice: db.original_price || db.price * 2,
  discountPercent: db.discount_percent || 0,
  category: db.category || "General",
  size: db.size || "Standard",
  stockQuantity: db.stock_quantity,
  image: normalizeImageUrl(db.image_url ? db.image_url.split(",")[0] : null),
  tagline: db.category || "Premium Footwear",
  notes: {
    top: [],
    heart: [],
    base: [],
  },
});

const mapOfflineProduct = (product: Product): SimpleProduct => ({
  id: product.id,
  name: product.name,
  description: product.description || "",
  price: product.price,
  originalPrice: product.originalPrice || product.price * 2,
  discountPercent: product.discountPercent || 0,
  category: product.category || "General",
  size: product.size || "Standard",
  stockQuantity: (product as any)._stock ?? 999,
  image: normalizeImageUrl(product.image),
  tagline: product.tagline || product.category || "Premium Footwear",
  notes: {
    top: product.construction?.upper || [],
    heart: product.construction?.midsole || [],
    base: product.construction?.outsole || [],
  },
});

const filterAndSortProducts = (
  products: SimpleProduct[],
  search: string,
  category: string,
  sortBy: string,
  priceMin: number,
  priceMax: number,
): SimpleProduct[] => {
  let filtered = products;

  if (search) {
    const lower = search.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower),
    );
  }

  if (category && category !== "All") {
    const lowerCategory = category.toLowerCase();
    const brandTerm = brandSearchTerms[category]?.toLowerCase();

    filtered = filtered.filter((p) => {
      const categoryMatch = p.category.toLowerCase().includes(lowerCategory);
      const brandMatch = brandTerm ? p.name.toLowerCase().includes(brandTerm) : false;
      return categoryMatch || brandMatch;
    });
  } else {
    filtered = filtered.filter(
      (p) => !excludedCategories.some((excluded) => p.category.toLowerCase().includes(excluded.toLowerCase())),
    );
  }

  if (priceMin > 0) filtered = filtered.filter((p) => p.price >= priceMin);
  if (priceMax < Infinity) filtered = filtered.filter((p) => p.price <= priceMax);

  switch (sortBy) {
    case "price-asc":
      return [...filtered].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...filtered].sort((a, b) => b.price - a.price);
    case "name-asc":
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    default:
      return filtered;
  }
};

const loadCsvFallbackPage = async (
  search: string,
  category: string,
  sortBy: string,
  priceMin: number,
  priceMax: number,
  pageParam: number,
): Promise<InfiniteProductsPage> => {
  const offlineCatalog = await getOfflineCatalogProducts();
  const mapped = offlineCatalog.map(mapOfflineProduct);
  const filtered = filterAndSortProducts(mapped, search, category, sortBy, priceMin, priceMax);

  const from = pageParam * PAGE_SIZE;
  const pageProducts = filtered.slice(from, from + PAGE_SIZE);

  return {
    products: pageProducts,
    totalCount: filtered.length,
    page: pageParam,
    pageSize: pageProducts.length,
  };
};

export const useInfiniteProducts = (options: UseInfiniteProductsOptions) => {
  const { search = "", category = "All", sortBy = "featured", priceMin = 0, priceMax = Infinity } = options;

  return useInfiniteQuery({
    queryKey: ["infinite-products", search, category, sortBy, priceMin, priceMax],
    queryFn: async ({ pageParam = 0 }) => {
      const includeCount = pageParam === 0;
      const controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), DB_QUERY_TIMEOUT_MS);

      try {
        let q = supabase
          .from("products")
          .select(
            "id,name,price,original_price,discount_percent,stock_quantity,category,size,image_url,created_at",
            { count: includeCount ? "exact" : undefined },
          )
          .eq("is_active", true)
          .is("deleted_at", null)
          .abortSignal(controller.signal);

        if (search) {
          q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (category && category !== "All") {
          const brandTerm = brandSearchTerms[category];
          if (brandTerm) {
            q = q.or(`category.ilike.%${category}%,name.ilike.%${brandTerm}%`);
          } else {
            q = q.ilike("category", `%${category}%`);
          }
        } else {
          q = q
            .not("category", "ilike", "%Louis Vuitton%")
            .not("category", "ilike", "%Socks%")
            .not("category", "ilike", "%Heels%")
            .not("category", "ilike", "%Bags%")
            .not("category", "ilike", "%Jersey%")
            .not("category", "ilike", "%Kids%");
        }

        if (priceMin > 0) q = q.gte("price", priceMin);
        if (priceMax < Infinity) q = q.lte("price", priceMax);

        switch (sortBy) {
          case "price-asc":
            q = q.order("price", { ascending: true });
            break;
          case "price-desc":
            q = q.order("price", { ascending: false });
            break;
          case "name-asc":
            q = q.order("name", { ascending: true });
            break;
          case "latest":
          case "rating":
          default:
            q = q.order("created_at", { ascending: false });
        }

        const from = pageParam * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        q = q.range(from, to);

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Query timed out")), DB_QUERY_TIMEOUT_MS + 500);
        });

        const { data, error, count } = (await Promise.race([q, timeoutPromise])) as {
          data: DbProduct[] | null;
          error: { message: string } | null;
          count: number | null;
        };

        if (error) throw new Error(error.message);

        const pageProducts = (data || []).map(mapProduct);

        return {
          products: pageProducts,
          totalCount: count ?? null,
          page: pageParam,
          pageSize: pageProducts.length,
        } satisfies InfiniteProductsPage;
      } catch (error) {
        console.error("Shop DB query failed, falling back to CSV:", error);
        return loadCsvFallbackPage(search, category, sortBy, priceMin, priceMax, pageParam);
      } finally {
        clearTimeout(abortTimeout);
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalCount = allPages[0]?.totalCount;
      if (typeof totalCount === "number" && totalCount >= 0) {
        const loadedCount = allPages.reduce((sum, page) => sum + page.pageSize, 0);
        return loadedCount < totalCount ? lastPage.page + 1 : undefined;
      }

      return lastPage.pageSize === PAGE_SIZE ? lastPage.page + 1 : undefined;
    },
    staleTime: 60 * 1000,
    retry: 1,
    retryDelay: 2000,
  });
};