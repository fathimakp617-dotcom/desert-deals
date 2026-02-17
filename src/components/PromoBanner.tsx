import { memo } from "react";
import { useNavigate } from "react-router-dom";
import promoImg from "@/assets/banners/promo-ramadan-delivery.webp";

const PromoBanner = memo(() => {
  const navigate = useNavigate();

  return (
    <section className="bg-background">
      <div
        className="relative w-full overflow-hidden cursor-pointer bg-muted"
        onClick={() => navigate("/shop")}
      >
        <img
          src={promoImg}
          alt="Ramadan Delivery - Shop Now"
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
