import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Exact brands from original HTML with product counts
const brands = [
  { name: "Puma", count: 14, slug: "puma", logo: "https://logo.clearbit.com/puma.com" },
  { name: "Onitsuka Tiger", count: 15, slug: "onitsuka-tiger", logo: "https://logo.clearbit.com/onitsukatiger.com" },
  { name: "On Cloud", count: 169, slug: "on-cloud", logo: "https://logo.clearbit.com/on-running.com" },
  { name: "Nike", count: 203, slug: "nike", logo: "https://logo.clearbit.com/nike.com" },
  { name: "New Balance", count: 111, slug: "new-balance", logo: "https://logo.clearbit.com/newbalance.com" },
  { name: "Louis Vuitton", count: 13, slug: "louis-vuitton", logo: "https://logo.clearbit.com/louisvuitton.com" },
  { name: "Loro Piana", count: 9, slug: "loro-piana", logo: "https://logo.clearbit.com/loropiana.com" },
  { name: "Jordan", count: 110, slug: "jordan", logo: "https://logo.clearbit.com/jordan.com" },
  { name: "Hoka", count: 47, slug: "hoka", logo: "https://logo.clearbit.com/hoka.com" },
  { name: "Hermes", count: 2, slug: "hermes", logo: "https://logo.clearbit.com/hermes.com" },
  { name: "Gucci", count: 12, slug: "gucci", logo: "https://logo.clearbit.com/gucci.com" },
  { name: "Dior", count: 3, slug: "dior", logo: "https://logo.clearbit.com/dior.com" },
  { name: "Basketball Shoes", count: 36, slug: "basketball", initials: "🏀" },
  { name: "Asics", count: 94, slug: "asics", logo: "https://logo.clearbit.com/asics.com" },
  { name: "Adidas", count: 72, slug: "adidas", logo: "https://logo.clearbit.com/adidas.com" },
];

const BrandCategories = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 260;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-6 sm:py-10 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative">
        {/* Arrow buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Carousel - matches site-slider carousel-style with 6 items visible */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 sm:mx-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              to={`/shop?brand=${brand.slug}`}
              className="flex-shrink-0 w-[140px] sm:w-[180px] lg:w-[200px] group"
            >
              {/* category-bg-gray style-1 from original */}
              <div className="bg-[hsl(var(--muted))] rounded-lg p-4 sm:p-5 text-center transition-all duration-300 hover:shadow-md">
                {/* Brand header */}
                <h3 className="text-sm font-heading font-semibold text-foreground tracking-tight leading-tight">
                  {brand.name}
                </h3>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  {brand.count} Products
                </span>

                {/* Brand image placeholder - matching category-block-image */}
                <div className="my-4 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-background flex items-center justify-center p-2">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `<span class="font-heading font-bold text-lg">${brand.initials || brand.name.slice(0, 2).toUpperCase()}</span>`;
                        }}
                      />
                    ) : (
                      <span className="font-heading font-bold text-2xl">{brand.initials}</span>
                    )}
                  </div>
                </div>

                {/* View Products button - btn btn-white btn-rounded btn-small */}
                <span className="text-[11px] font-medium text-foreground border border-border bg-background rounded-full px-4 py-1.5 inline-block group-hover:bg-foreground group-hover:text-background transition-colors">
                  View Products
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

BrandCategories.displayName = "BrandCategories";

export default BrandCategories;
