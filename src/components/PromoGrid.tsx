import { Link } from "react-router-dom";
import { useBanners } from "@/hooks/useBanners";
import ramadanPromo from "@/assets/banners/ramadan-promo.webp";

const PromoGrid = () => {
  const { data: gridBanners } = useBanners("promo-grid");

  const banner = gridBanners?.[0];
  const imgSrc = banner?.image_url || ramadanPromo;
  const link = banner?.link_url || "/shop";
  const alt = banner?.title || "Promo";

  return (
    <section className="w-full">
      <Link to={link} className="block overflow-hidden group">
        <img
          src={imgSrc}
          alt={alt}
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </Link>
    </section>
  );
};

export default PromoGrid;
