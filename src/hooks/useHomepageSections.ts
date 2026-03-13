import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomepageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  is_visible: boolean;
  sort_order: number;
  section_type: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const useHomepageSections = () => {
  return useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("id, section_key, title, subtitle, is_visible, sort_order, section_type, config, created_at, updated_at")
        .eq("is_visible", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as HomepageSection[];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: "always",
    retry: 6,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
