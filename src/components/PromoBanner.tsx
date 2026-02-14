import { memo } from "react";
import { useNavigate } from "react-router-dom";
import heroCollection from "@/assets/shoes/hero-collection.jpg";

// Secondary promotional banner from the original HTML (the banner between brand categories and top sellers)
const PromoBanner = memo(() => {
  const navigate = useNavigate();

  return (
    <section className="py-2 sm:py-4 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div
          className="relative w-full h-[200px] sm:h-[520px] lg:h-[820px] rounded-lg overflow-hidden cursor-pointer"
          onClick={() => navigate("/shop")}
        >
          <img
            src={heroCollection}
            alt="Shop Now"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Shop Now button centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="bg-white text-foreground hover:bg-white/90 px-6 sm:px-10 py-2 sm:py-3.5 text-xs sm:text-sm tracking-wider font-medium rounded-full transition-all duration-300">
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

PromoBanner.displayName = "PromoBanner";

export default PromoBanner;
