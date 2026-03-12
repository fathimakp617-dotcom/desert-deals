import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Import all banner assets for mapping
import slide1 from "@/assets/banners/slide-1.webp";
import slide2 from "@/assets/banners/slide-2.png";
import slide3 from "@/assets/banners/slide-3.webp";
import slide4 from "@/assets/banners/slide-4.webp";
import slide5 from "@/assets/banners/slide-5.jpg";
import slide6 from "@/assets/banners/slide-6.png";
import slide7 from "@/assets/banners/slide-7.jpg";
import slide8 from "@/assets/banners/slide-8.webp";
import slide9 from "@/assets/banners/slide-9.webp";
import slide10 from "@/assets/banners/slide-10.png";
import promoRamadan from "@/assets/banners/promo-ramadan-delivery.webp";
import ramadanPromo from "@/assets/banners/ramadan-promo.webp";
import onCloudAd from "@/assets/banners/on-cloud-ad.webp";
import nikeDunkAd from "@/assets/banners/nike-dunk-low-ad.webp";
import adidasAd from "@/assets/banners/adidas-ad.jpeg";
import promo1 from "@/assets/banners/promo-1.webp";
import promo2 from "@/assets/banners/promo-2.webp";
import promo3 from "@/assets/banners/promo-3.webp";
import promo4 from "@/assets/banners/promo-4.webp";
import promo5 from "@/assets/banners/promo-5.webp";
import promoGrid1 from "@/assets/banners/promo-grid-1.webp";
import promoGrid2 from "@/assets/banners/promo-grid-2.jpeg";

// Map relative paths to bundled asset URLs
const assetMap: Record<string, string> = {
  "/banners/slide-1.webp": slide1,
  "/banners/slide-2.png": slide2,
  "/banners/slide-3.webp": slide3,
  "/banners/slide-4.webp": slide4,
  "/banners/slide-5.jpg": slide5,
  "/banners/slide-6.png": slide6,
  "/banners/slide-7.jpg": slide7,
  "/banners/slide-8.webp": slide8,
  "/banners/slide-9.webp": slide9,
  "/banners/slide-10.png": slide10,
  "/banners/promo-ramadan-delivery.webp": promoRamadan,
  "/banners/ramadan-promo.webp": ramadanPromo,
  "/banners/on-cloud-ad.webp": onCloudAd,
  "/banners/nike-dunk-low-ad.webp": nikeDunkAd,
  "/banners/adidas-ad.jpeg": adidasAd,
  "/banners/promo-1.webp": promo1,
  "/banners/promo-2.webp": promo2,
  "/banners/promo-3.webp": promo3,
  "/banners/promo-4.webp": promo4,
  "/banners/promo-5.webp": promo5,
  "/banners/promo-grid-1.webp": promoGrid1,
  "/banners/promo-grid-2.jpeg": promoGrid2,
};

const resolveImageUrl = (url: string): string => {
  // If it's already a full URL (http/https or data:), use as-is
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  // Check asset map for relative paths
  return assetMap[url] || url;
};

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: string;
  sort_order: number;
  is_active: boolean;
  show_button: boolean;
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
      // Resolve image URLs from relative paths to bundled assets
      return (data || []).map(b => ({
        ...b,
        image_url: resolveImageUrl(b.image_url),
      })) as Banner[];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
