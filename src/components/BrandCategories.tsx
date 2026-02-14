import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const brands = [
  { name: "Nike", count: 203, slug: "nike" },
  { name: "Adidas", count: 72, slug: "adidas" },
  { name: "Jordan", count: 110, slug: "jordan" },
  { name: "New Balance", count: 111, slug: "new-balance" },
  { name: "On Cloud", count: 169, slug: "on-cloud" },
  { name: "Hoka", count: 47, slug: "hoka" },
  { name: "Asics", count: 94, slug: "asics" },
  { name: "Puma", count: 14, slug: "puma" },
  { name: "Brooks", count: 8, slug: "brooks" },
  { name: "Onitsuka Tiger", count: 15, slug: "onitsuka-tiger" },
];

const BrandCategories = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-8 sm:py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 sm:px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              to={`/shop?category=${brand.slug}`}
              className="flex-shrink-0 w-[160px] sm:w-[200px] group"
            >
              <div className="bg-muted rounded-xl p-5 sm:p-6 text-center transition-all duration-300 hover:shadow-md hover:bg-muted/80">
                <h3 className="text-sm sm:text-base font-heading font-semibold text-foreground tracking-tight">
                  {brand.name}
                </h3>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {brand.count} Products
                </span>
                <div className="mt-4">
                  <span className="text-xs font-medium text-foreground border border-border rounded-full px-4 py-1.5 inline-block group-hover:bg-foreground group-hover:text-background transition-colors">
                    View Products
                  </span>
                </div>
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
