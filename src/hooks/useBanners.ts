import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBanners = (position?: string) => {
  return useQuery({
    queryKey: ["banners", position],
    queryFn: async () => {
      let query = supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (position) {
        query = query.eq("position", position);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Banner[];
    },
    staleTime: 5 * 60 * 1000,
  });
};
