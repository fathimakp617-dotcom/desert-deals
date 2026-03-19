import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createTimeoutSignal } from "@/lib/supabaseTimeout";

// Lazy asset map — only loaded when a relative path is encountered
let assetMap: Record<string, string> | null = null;
const loadAssetMap = async (): Promise<Record<string, string>> => {
  if (assetMap) return assetMap;
  const [
    { default: slide1 }, { default: slide2 }, { default: slide3 }, { default: slide4 },
    { default: slide5 }, { default: slide6 }, { default: slide7 }, { default: slide8 },
    { default: slide9 }, { default: slide10 },
    { default: promoRamadan }, { default: ramadanPromo },
    { default: onCloudAd }, { default: nikeDunkAd }, { default: adidasAd },
    { default: promo1 }, { default: promo2 }, { default: promo3 },
    { default: promo4 }, { default: promo5 },
    { default: promoGrid1 }, { default: promoGrid2 },
  ] = await Promise.all([
    import("@/assets/banners/slide-1.webp"),
    import("@/assets/banners/slide-2.png"),
    import("@/assets/banners/slide-3.webp"),
    import("@/assets/banners/slide-4.webp"),
    import("@/assets/banners/slide-5.jpg"),
    import("@/assets/banners/slide-6.png"),
    import("@/assets/banners/slide-7.jpg"),
    import("@/assets/banners/slide-8.webp"),
    import("@/assets/banners/slide-9.webp"),
    import("@/assets/banners/slide-10.png"),
    import("@/assets/banners/promo-ramadan-delivery.webp"),
    import("@/assets/banners/ramadan-promo.webp"),
    import("@/assets/banners/on-cloud-ad.webp"),
    import("@/assets/banners/nike-dunk-low-ad.webp"),
    import("@/assets/banners/adidas-ad.jpeg"),
    import("@/assets/banners/promo-1.webp"),
    import("@/assets/banners/promo-2.webp"),
    import("@/assets/banners/promo-3.webp"),
    import("@/assets/banners/promo-4.webp"),
    import("@/assets/banners/promo-5.webp"),
    import("@/assets/banners/promo-grid-1.webp"),
    import("@/assets/banners/promo-grid-2.jpeg"),
  ]);
  assetMap = {
    "/banners/slide-1.webp": slide1, "/banners/slide-2.png": slide2,
    "/banners/slide-3.webp": slide3, "/banners/slide-4.webp": slide4,
    "/banners/slide-5.jpg": slide5, "/banners/slide-6.png": slide6,
    "/banners/slide-7.jpg": slide7, "/banners/slide-8.webp": slide8,
    "/banners/slide-9.webp": slide9, "/banners/slide-10.png": slide10,
    "/banners/promo-ramadan-delivery.webp": promoRamadan,
    "/banners/ramadan-promo.webp": ramadanPromo,
    "/banners/on-cloud-ad.webp": onCloudAd,
    "/banners/nike-dunk-low-ad.webp": nikeDunkAd,
    "/banners/adidas-ad.jpeg": adidasAd,
    "/banners/promo-1.webp": promo1, "/banners/promo-2.webp": promo2,
    "/banners/promo-3.webp": promo3, "/banners/promo-4.webp": promo4,
    "/banners/promo-5.webp": promo5,
    "/banners/promo-grid-1.webp": promoGrid1,
    "/banners/promo-grid-2.jpeg": promoGrid2,
  };
  return assetMap;
};

const resolveImageUrl = async (url: string): Promise<string> => {
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const map = await loadAssetMap();
  return map[url] || url;
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
      const { signal, clear } = createTimeoutSignal(5000);
      try {
        let query = supabase
          .from("banners")
          .select("id, title, image_url, link_url, position, sort_order, is_active, show_button, created_at, updated_at")
          .eq("is_active", true)
          .order("sort_order");

        if (position) {
          query = query.eq("position", position);
        }

        const { data, error } = await query.abortSignal(signal);
        if (error) throw error;

      const banners = data || [];
      // Only load asset map if any banner uses relative paths
      const needsAssetMap = banners.some(b => !b.image_url.startsWith("http") && !b.image_url.startsWith("data:"));
      
      if (needsAssetMap) {
        const resolved = await Promise.all(
          banners.map(async (b) => ({
            ...b,
            image_url: await resolveImageUrl(b.image_url),
          }))
        );
        return resolved as Banner[];
      }

      return banners as Banner[];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};
