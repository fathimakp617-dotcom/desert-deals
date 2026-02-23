import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useBanners } from "@/hooks/useBanners";
import promoImg from "@/assets/banners/promo-ramadan-delivery.webp";

const PromoBanner = memo(() => {
  const navigate = useNavigate();
  const { data: promoBanners } = useBanners("promo");

  const banner = promoBanners?.[0];
  const imgSrc = banner?.image_url || promoImg;
  const link = banner?.link_url || "/shop";
  const alt = banner?.title || "Promo Banner";

  return (
    <section className="bg-background px-3 sm:px-4">
      <div
        className="relative w-full overflow-hidden cursor-pointer bg-muted rounded-xl sm:rounded-2xl"
        onClick={() => navigate(link)}
      >
        <img
          src={imgSrc}
          alt={alt}
          className="w-full h-auto object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
});

PromoBanner.displayName = "PromoBanner";

export default PromoBanner;
