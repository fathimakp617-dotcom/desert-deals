import { memo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import pumaLogo from "@/assets/brands/puma.webp";
import onitsukaTigerLogo from "@/assets/brands/onitsuka-tiger.webp";
import onCloudLogo from "@/assets/brands/on-cloud.png";
import nikeLogo from "@/assets/brands/nike.svg";
import newBalanceLogo from "@/assets/brands/new-balance.webp";
import louisVuittonLogo from "@/assets/brands/louis-vuitton.webp";
import loroPianaLogo from "@/assets/brands/loro-piana.webp";
import jordanLogo from "@/assets/brands/jordan.webp";
import hermesLogo from "@/assets/brands/hermes.webp";
import diorLogo from "@/assets/brands/dior.webp";
import airJordanLogo from "@/assets/brands/air-jordan.webp";
import adidasLogo from "@/assets/brands/adidas.svg";
import asicsLogo from "@/assets/brands/asics.svg";
import hokaLogo from "@/assets/brands/hoka.png";
import gucciLogo from "@/assets/brands/gucci.png";

const brands = [
  { name: "Puma", count: 14, slug: "puma", logo: pumaLogo, fallback: "PUMA" },
  { name: "Onitsuka Tiger", count: 15, slug: "onitsuka-tiger", logo: onitsukaTigerLogo, fallback: "OT" },
  { name: "On Cloud", count: 169, slug: "on-cloud", logo: onCloudLogo, fallback: "ON" },
  { name: "Nike", count: 203, slug: "nike", logo: nikeLogo, fallback: "NIKE" },
  { name: "New Balance", count: 111, slug: "new-balance", logo: newBalanceLogo, fallback: "NB" },
  { name: "Louis Vuitton", count: 13, slug: "louis-vuitton", logo: louisVuittonLogo, fallback: "LV" },
  { name: "Loro Piana", count: 9, slug: "loro-piana", logo: loroPianaLogo, fallback: "LP" },
  { name: "Jordan", count: 110, slug: "jordan", logo: jordanLogo, fallback: "JD" },
  { name: "Hoka", count: 47, slug: "hoka", logo: hokaLogo, fallback: "HOKA" },
  { name: "Hermes", count: 2, slug: "hermes", logo: hermesLogo, fallback: "HM" },
  { name: "Gucci", count: 12, slug: "gucci", logo: gucciLogo, fallback: "GUCCI" },
  { name: "Dior", count: 3, slug: "dior", logo: diorLogo, fallback: "DIOR" },
  { name: "Basketball Shoes", count: 36, slug: "basketball", logo: airJordanLogo, fallback: "🏀" },
  { name: "Asics", count: 94, slug: "asics", logo: asicsLogo, fallback: "ASICS" },
  { name: "Adidas", count: 72, slug: "adidas", logo: adidasLogo, fallback: "ADIDAS" },
];

const BrandLogo = memo(({ logo, fallback, name }: { logo: string; fallback: string; name: string }) => {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) {
    return <span className="font-heading font-bold text-lg tracking-tight">{fallback}</span>;
  }
  return <img src={logo} alt={name} width={91} height={91} className="w-full h-full object-contain" loading="lazy" onError={() => setFailed(true)} />;
});
BrandLogo.displayName = "BrandLogo";

const MobileBrandCarousel = memo(({ brands: brandList }: { brands: typeof brands }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };
  return (
    <div className="sm:hidden relative">
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/90 border border-border rounded-full flex items-center justify-center text-foreground shadow-sm"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/90 border border-border rounded-full flex items-center justify-center text-foreground shadow-sm"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar px-5 snap-x snap-mandatory scroll-smooth">
        {brandList.map((brand) => (
          <Link key={brand.slug} to={`/shop?brand=${brand.slug}`} className="flex-shrink-0 w-[calc(33.333%-6px)] snap-start group">
            <div className="bg-muted rounded-lg p-3 text-center transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-center mb-2">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center p-1.5">
                  <BrandLogo logo={brand.logo} fallback={brand.fallback} name={brand.name} />
                </div>
              </div>
              <h3 className="text-[11px] font-heading font-semibold text-foreground tracking-tight leading-tight min-h-[2.5em] flex items-center justify-center">{brand.name}</h3>
              <span className="text-[10px] text-muted-foreground block">{brand.count} Products</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});
MobileBrandCarousel.displayName = "MobileBrandCarousel";

const BrandCategories = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === "left" ? -260 : 260, behavior: "smooth" });
    }
  };

  return (
    <section className="pt-3 pb-6 sm:pt-4 sm:pb-10 bg-background">
      <div className="relative">
        <div className="px-4 sm:hidden">
          <MobileBrandCarousel brands={brands} />
        </div>

        {/* Desktop: scrollable row matching reference */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          ref={scrollRef}
          className="hidden sm:flex gap-4 overflow-x-auto px-10"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {brands.map((brand) => (
          <Link key={brand.slug} to={`/shop?brand=${brand.slug}`} className="flex-shrink-0 w-[230px] lg:w-[260px] group">
              <div className="bg-muted/50 border border-border/40 rounded-lg p-6 h-full flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:border-border">
                <h3 className="text-lg font-heading font-bold text-foreground tracking-tight">{brand.name}</h3>
                <span className="text-sm text-muted-foreground mt-0.5">{brand.count} Products</span>
                <div className="flex-1 flex items-center justify-center my-6">
                  <div className="w-32 h-32 flex items-center justify-center p-2">
                    <BrandLogo logo={brand.logo} fallback={brand.fallback} name={brand.name} />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-foreground bg-background border border-border rounded-full px-4 py-1.5 inline-block group-hover:bg-foreground group-hover:text-background transition-colors">
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
