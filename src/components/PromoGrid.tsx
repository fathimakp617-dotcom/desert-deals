import { Link } from "react-router-dom";
import ramadanPromo from "@/assets/banners/ramadan-promo.webp";

const PromoGrid = () => {
  return (
    <section className="w-full">
      <Link to="/shop" className="block overflow-hidden group">
        <img
          src={ramadanPromo}
          alt="Ramadan Season Promo - Free Delivery"
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </Link>
    </section>
  );
};

export default PromoGrid;