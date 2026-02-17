import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

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

interface UsePaginatedProductsOptions {
  search?: string;
  category?: string;
  sortBy?: string;
  priceMin?: number;
  priceMax?: number;
}

export const usePaginatedProducts = (options: UsePaginatedProductsOptions) => {
  const [page, setPage] = useState(0);

  const { search = "", category = "All", sortBy = "featured", priceMin = 0, priceMax = Infinity } = options;

  // Build a stable query key
  const queryKey = ["paginated-products", search, category, sortBy, priceMin, priceMax, page];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("is_active", true);

      // Search filter (server-side)
      if (search) {
        q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Category/Brand filter - search by name since most products use generic categories
      if (category && category !== "All") {
        const brandSearchTerms: Record<string, string> = {
          "Nike": "Nike",
          "Jordan": "Jordan",
          "New Balance": "New Balance",
          "On Cloud": "On ",
          "Asics": "Asics",
          "Adidas": "Adidas",
          "Hoka": "Hoka",
          "Puma": "Puma",
          "Louis Vuitton": "Louis Vuitton",
          "Gucci": "Gucci",
          "Onitsuka Tiger": "Onitsuka",
          "Loro Piana": "Loro Piana",
          "Brooks": "Brooks",
          "Dior": "Dior",
          "Hermes": "Hermes",
          "Basketball Shoes": "Basketball",
        };
        const brandTerm = brandSearchTerms[category];
        if (brandTerm) {
          q = q.or(`category.eq.${category},name.ilike.%${brandTerm}%`);
        } else {
          q = q.eq("category", category);
        }
      }

      // Price filter
      if (priceMin > 0) {
        q = q.gte("price", priceMin);
      }
      if (priceMax < Infinity) {
        q = q.lte("price", priceMax);
      }

      // Sorting
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
        default:
          q = q.order("created_at", { ascending: false });
      }

      // Pagination
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;

      if (error) throw error;

      return {
        products: (data as DbProduct[]).map(mapProduct),
        totalCount: count || 0,
        hasMore: (count || 0) > (page + 1) * PAGE_SIZE,
        page,
      };
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev, // keep previous data while loading
  });

  // Reset page when filters change
  const resetPage = useCallback(() => setPage(0), []);

  return {
    ...query,
    page,
    setPage,
    resetPage,
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(0, p - 1)),
    pageSize: PAGE_SIZE,
  };
};
