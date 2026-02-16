import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Local brand logo imports
import pumaLogo from "@/assets/brands/puma.webp";
import onitsukaTigerLogo from "@/assets/brands/onitsuka-tiger.webp";
import onCloudLogo from "@/assets/brands/on-cloud.png";
import newBalanceLogo from "@/assets/brands/new-balance.webp";
import louisVuittonLogo from "@/assets/brands/louis-vuitton.webp";
import loroPianaLogo from "@/assets/brands/loro-piana.webp";
import jordanLogo from "@/assets/brands/jordan.webp";
import hermesLogo from "@/assets/brands/hermes.webp";
import diorLogo from "@/assets/brands/dior.webp";

const brands = [
  { name: "Puma", count: 14, slug: "puma", logo: pumaLogo },
  { name: "Onitsuka Tiger", count: 15, slug: "onitsuka-tiger", logo: onitsukaTigerLogo },
  { name: "On Cloud", count: 169, slug: "on-cloud", logo: onCloudLogo },
  { name: "Nike", count: 203, slug: "nike", logo: "https://cdn.worldvectorlogo.com/logos/nike-4.svg" },
  { name: "New Balance", count: 111, slug: "new-balance", logo: newBalanceLogo },
  { name: "Louis Vuitton", count: 13, slug: "louis-vuitton", logo: louisVuittonLogo },
  { name: "Loro Piana", count: 9, slug: "loro-piana", logo: loroPianaLogo },
  { name: "Jordan", count: 110, slug: "jordan", logo: jordanLogo },
  { name: "Hoka", count: 47, slug: "hoka", logo: "https://cdn.worldvectorlogo.com/logos/hoka-one-one.svg" },
  { name: "Hermes", count: 2, slug: "hermes", logo: hermesLogo },
  { name: "Gucci", count: 12, slug: "gucci", logo: "https://cdn.worldvectorlogo.com/logos/gucci-logo-1.svg" },
  { name: "Dior", count: 3, slug: "dior", logo: diorLogo },
  { name: "Basketball Shoes", count: 36, slug: "basketball", logo: "https://cdn.worldvectorlogo.com/logos/jumpman.svg" },
  { name: "Asics", count: 94, slug: "asics", logo: "https://cdn.worldvectorlogo.com/logos/asics-1.svg" },
  { name: "Adidas", count: 72, slug: "adidas", logo: "https://cdn.worldvectorlogo.com/logos/adidas-logo.svg" },
];

const BrandCategories = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -260 : 260,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-6 sm:py-10 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative">
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
              <div className="bg-[hsl(var(--muted))] rounded-lg p-4 sm:p-5 text-center transition-all duration-300 hover:shadow-md">
                <h3 className="text-sm font-heading font-semibold text-foreground tracking-tight leading-tight">
                  {brand.name}
                </h3>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  {brand.count} Products
                </span>

                <div className="my-4 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center p-2">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>

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
