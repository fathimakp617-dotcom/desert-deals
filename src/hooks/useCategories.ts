import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  value: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  show_in_collection: boolean;
  show_in_header: boolean;
  created_at: string;
}

// Fallback categories when DB is unavailable
const fallbackCategories: Category[] = [
  { id: "1", value: "nike", label: "Nike", is_active: true, sort_order: 1, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "2", value: "jordan", label: "Jordan", is_active: true, sort_order: 2, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "3", value: "adidas", label: "Adidas", is_active: true, sort_order: 3, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "4", value: "new-balance", label: "New Balance", is_active: true, sort_order: 4, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "5", value: "asics", label: "Asics", is_active: true, sort_order: 5, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "6", value: "on-cloud", label: "On Cloud", is_active: true, sort_order: 6, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "7", value: "hoka", label: "Hoka", is_active: true, sort_order: 7, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "8", value: "puma", label: "Puma", is_active: true, sort_order: 8, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "9", value: "onitsuka-tiger", label: "Onitsuka Tiger", is_active: true, sort_order: 9, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "10", value: "loro-piana", label: "Loro Piana", is_active: true, sort_order: 10, show_in_collection: true, show_in_header: true, created_at: "" },
  { id: "11", value: "louis-vuitton", label: "Louis Vuitton", is_active: true, sort_order: 11, show_in_collection: false, show_in_header: true, created_at: "" },
  { id: "12", value: "socks", label: "Socks", is_active: true, sort_order: 12, show_in_collection: false, show_in_header: false, created_at: "" },
  { id: "13", value: "Kids", label: "Kids", is_active: true, sort_order: 13, show_in_collection: false, show_in_header: true, created_at: "" },
  { id: "14", value: "heels", label: "Heels", is_active: true, sort_order: 20, show_in_collection: false, show_in_header: true, created_at: "" },
  { id: "15", value: "bags", label: "Bags", is_active: true, sort_order: 21, show_in_collection: false, show_in_header: true, created_at: "" },
  { id: "16", value: "jersey", label: "Jersey", is_active: true, sort_order: 100, show_in_collection: false, show_in_header: false, created_at: "" },
];

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error || !data || data.length === 0) return fallbackCategories;
      return (data as any[]);
    },
    staleTime: 10 * 60 * 1000,
    placeholderData: fallbackCategories,
  });
};
