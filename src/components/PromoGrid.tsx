import { Link } from "react-router-dom";
import promoGrid1 from "@/assets/banners/promo-grid-1.webp";
import promoGrid2 from "@/assets/banners/promo-grid-2.jpeg";

const PromoGrid = () => {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-[auto] gap-0">
        {/* Large left image - spans 2 columns */}
        <Link to="/shop" className="md:col-span-2 row-span-2 overflow-hidden group">
          <img
            src={promoGrid1}
            alt="Nike Mind Collection"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Right product card */}
        <Link
          to="/shop"
          className="bg-muted flex flex-col items-center justify-center p-6 md:p-8 group"
        >
          <div className="w-full max-w-[280px]">
            <img
              src={promoGrid2}
              alt="Nike Mind 002 Black"
              className="w-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </Link>
      </div>
    </section>
  );
};

export default PromoGrid;
