import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 60;

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

const mapProduct = (db: DbProduct): SimpleProduct => {
  return {
    id: db.id,
    name: db.name,
    description: "",
    price: db.price,
    originalPrice: db.original_price || db.price * 2,
    discountPercent: db.discount_percent || 0,
    category: db.category || "General",
    size: db.size || "Standard",
    stockQuantity: db.stock_quantity,
    image: db.image_url ? db.image_url.split(",")[0].trim() : "",
    tagline: db.category || "Premium Footwear",
    notes: {
      top: [],
      heart: [],
      base: [],
    },
  };
};

interface UseInfiniteProductsOptions {
  search?: string;
  category?: string;
  sortBy?: string;
  priceMin?: number;
  priceMax?: number;
}

const brandSearchTerms: Record<string, string> = {
  "Nike": "Nike", "Jordan": "Jordan", "New Balance": "New Balance",
  "On Cloud": "On Cloud", "Asics": "Asics", "Adidas": "Adidas",
  "Hoka": "Hoka", "Puma": "Puma", "Louis Vuitton": "Louis Vuitton",
  "Gucci": "Gucci", "Onitsuka Tiger": "Onitsuka", "Loro Piana": "Loro Piana",
  "Brooks": "Brooks", "Dior": "Dior", "Hermes": "Hermes",
  "Basketball Shoes": "Basketball", "Watches": "Watches", "Wallets": "Wallets",
  "Sunglasses": "Sunglasses", "Heels": "Heels", "Rolex": "Rolex",
  "Cartier": "Cartier", "Tom Ford": "Tom Ford",
  "Christian Louboutin": "Louboutin", "Chanel": "Chanel", "Goyard": "Goyard",
  "Bags": "Bags", "Socks": "Socks", "Jersey": "Jersey", "Kids": "Kids",
};

const excludedCategories = ["Louis Vuitton", "Socks", "Heels", "Bags", "Jersey", "Kids"];

/** Load CSV fallback and filter/sort client-side to match query params */
const loadCsvFallback = async (
  search: string,
  category: string,
  sortBy: string,
  priceMin: number,
  priceMax: number,
  pageParam: number,
): Promise<{ products: SimpleProduct[]; totalCount: number; page: number; pageSize: number }> => {
  const response = await fetch("/data/wc-product-export.csv", { cache: "no-store" });
  if (!response.ok) throw new Error("CSV load failed");

  const text = await response.text();
  // Re-use the CSV parser from useDbProducts via a simplified inline version
  const rows = text.split("\n");
  const headers = rows[0]?.split(",").map(h => h.replace(/"/g, "").trim()) || [];

  const col = (name: string) => headers.indexOf(name);
  const iName = col("Name");
  const iType = col("Type");
  const iSKU = col("SKU");
  const iID = col("ID");
  const iInStock = col("In stock?");
  const iSalePrice = col("Sale price");
  const iRegPrice = col("Regular price");
  const iCategories = col("Categories");
  const iImages = col("Images");

  // Quick rough parse — only need simple products for fallback display
  const products: SimpleProduct[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    // Simple CSV field split (handles most cases)
    const fields = rows[i].match(/(".*?"|[^,]*)/g)?.map(f => f.replace(/^"|"$/g, "").trim()) || [];
    const type = fields[iType] || "";
    if (type !== "variable" && type !== "simple") continue;

    const name = fields[iName] || "";
    const sku = fields[iSKU] || "";
    const wooId = fields[iID] || "";
    const id = sku || name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").substring(0, 80) || `product-${wooId}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const inStock = fields[iInStock] || "";
    if (inStock === "0") continue;

    const sale = parseFloat(fields[iSalePrice] || "0") || 0;
    const reg = parseFloat(fields[iRegPrice] || "0") || 0;
    const price = sale > 0 ? sale : reg;
    if (price <= 0) continue;

    const cats = fields[iCategories] || "";
    const catParts = cats.split(",").map(c => c.trim()).filter(Boolean);
    const brand = catParts.find(p => p !== "All Shoes" && p !== "Uncategorized") || catParts[0] || "All Shoes";

    const imageUrl = (fields[iImages] || "").split(",")[0]?.trim() || "";

    const originalPrice = reg > 0 ? reg : price * 2;
    const discountPercent = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    products.push({
      id,
      name,
      description: "",
      price,
      originalPrice,
      discountPercent,
      category: brand,
      size: "EU 36-45",
      stockQuantity: 999,
      image: imageUrl,
      tagline: brand,
      notes: { top: [], heart: [], base: [] },
    });
  }

  // Apply filters client-side
  let filtered = products;

  if (search) {
    const lower = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(lower));
  }

  if (category && category !== "All") {
    const brandTerm = brandSearchTerms[category];
    if (brandTerm) {
      const lowerBrand = brandTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.category.toLowerCase().includes(category.toLowerCase()) ||
        p.name.toLowerCase().includes(lowerBrand)
      );
    } else {
      filtered = filtered.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }
  } else if (category === "All") {
    filtered = filtered.filter(p =>
      !excludedCategories.some(ex => p.category.toLowerCase().includes(ex.toLowerCase()))
    );
  }

  if (priceMin > 0) filtered = filtered.filter(p => p.price >= priceMin);
  if (priceMax < Infinity) filtered = filtered.filter(p => p.price <= priceMax);

  // Sort
  switch (sortBy) {
    case "price-asc": filtered.sort((a, b) => a.price - b.price); break;
    case "price-desc": filtered.sort((a, b) => b.price - a.price); break;
    case "name-asc": filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: break; // CSV is already in order
  }

  const total = filtered.length;
  const from = pageParam * PAGE_SIZE;
  const page = filtered.slice(from, from + PAGE_SIZE);

  return {
    products: page,
    totalCount: total,
    page: pageParam,
    pageSize: page.length,
  };
};

export const useInfiniteProducts = (options: UseInfiniteProductsOptions) => {
  const { search = "", category = "All", sortBy = "featured", priceMin = 0, priceMax = Infinity } = options;

  return useInfiniteQuery({
    queryKey: ["infinite-products", search, category, sortBy, priceMin, priceMax],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        // Race DB query against a 5s timeout
        const controller = new AbortController();
        const abortTimeout = setTimeout(() => controller.abort(), 5000);

        const includeCount = pageParam === 0;

        let q = supabase
          .from("products")
          .select(
            "id,name,price,original_price,discount_percent,stock_quantity,category,size,image_url,created_at",
            { count: includeCount ? "exact" : undefined }
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
        } else if (category === "All") {
          q = q.not("category", "ilike", "%Louis Vuitton%")
               .not("category", "ilike", "%Socks%")
               .not("category", "ilike", "%Heels%")
               .not("category", "ilike", "%Bags%")
               .not("category", "ilike", "%Jersey%")
               .not("category", "ilike", "%Kids%");
        }

        if (priceMin > 0) q = q.gte("price", priceMin);
        if (priceMax < Infinity) q = q.lte("price", priceMax);

        switch (sortBy) {
          case "price-asc": q = q.order("price", { ascending: true }); break;
          case "price-desc": q = q.order("price", { ascending: false }); break;
          case "name-asc": q = q.order("name", { ascending: true }); break;
          case "latest":
          case "rating":
          default:
            q = q.order("created_at", { ascending: false });
        }

        const from = pageParam * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        q = q.range(from, to);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Query timed out")), 5500)
        );

        const { data, error, count } = await Promise.race([q, timeoutPromise]);
        clearTimeout(abortTimeout);

        if (error) throw error;

        const pageProducts = (data as DbProduct[]) || [];

        return {
          products: pageProducts.map(mapProduct),
          totalCount: count ?? null,
          page: pageParam,
          pageSize: pageProducts.length,
        };
      } catch (error) {
        console.error("Shop DB query failed, falling back to CSV:", error);
        return loadCsvFallback(search, category, sortBy, priceMin, priceMax, pageParam);
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
