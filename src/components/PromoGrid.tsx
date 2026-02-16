import { Link } from "react-router-dom";
import promoGrid1 from "@/assets/banners/promo-grid-1.webp";
import promoGrid2 from "@/assets/banners/promo-grid-2.jpeg";

const PromoGrid = () => {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Large left image - spans 2 columns on desktop */}
        <Link to="/shop" className="md:col-span-2 overflow-hidden group">
          <img
            src={promoGrid1}
            alt="Nike Mind Collection"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Right product card */}
        <Link
          to="/shop?search=nike"
          className="bg-muted flex flex-col items-center justify-center p-6 md:p-10 group"
        >
          <div className="w-full max-w-[300px] flex flex-col items-center">
            <img
              src={promoGrid2}
              alt="NM 002 Street Runner"
              className="w-full object-contain transition-transform duration-500 group-hover:scale-105 mb-6"
              loading="lazy"
            />
            <div className="w-full text-left space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">All Products</p>
              <h3 className="text-base font-bold text-foreground">NM 002 Street Runner</h3>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-base font-semibold text-foreground">379.00 د.إ</span>
                <span className="text-sm text-muted-foreground line-through">1,899.00 د.إ</span>
              </div>
              <p className="text-xs font-semibold text-primary pt-1">IN STOCK</p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default PromoGrid;
