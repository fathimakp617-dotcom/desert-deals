import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 48;

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
  notes: { top: string[]; heart: string[]; base: string[] };
}

const mapProduct = (db: DbProduct): SimpleProduct => ({
  id: db.id,
  name: db.name,
  description: db.description || "",
  price: db.price,
  originalPrice: db.original_price || db.price * 2,
  discountPercent: db.discount_percent || 0,
  category: db.category || "General",
  size: db.size || "Standard",
  image: db.image_url ? db.image_url.split(",")[0].trim() : "",
  tagline: db.category || "Premium Footwear",
  notes: {
    top: db.notes?.top || [],
    heart: db.notes?.middle || [],
    base: db.notes?.base || [],
  },
});

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

export const useInfiniteProducts = (options: UseInfiniteProductsOptions) => {
  const { search = "", category = "All", sortBy = "featured", priceMin = 0, priceMax = Infinity } = options;

  return useInfiniteQuery({
    queryKey: ["infinite-products", search, category, sortBy, priceMin, priceMax],
    queryFn: async ({ pageParam = 0 }) => {
      let q = supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("is_active", true);

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
        // Exclude categories that have dedicated pages — only shown via direct nav links
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

      const { data, error, count } = await q;
      if (error) throw error;

      return {
        products: (data as DbProduct[]).map(mapProduct),
        totalCount: count || 0,
        page: pageParam,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage * PAGE_SIZE < lastPage.totalCount ? nextPage : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
};
