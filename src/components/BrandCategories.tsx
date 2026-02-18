import { memo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import pumaLogo from "@/assets/brands/puma.png";
import onitsukaTigerLogo from "@/assets/brands/onitsuka-tiger.png";
import onCloudLogo from "@/assets/brands/on-cloud.png";
import nikeLogo from "@/assets/brands/nike.png";
import newBalanceLogo from "@/assets/brands/new-balance.png";
import louisVuittonLogo from "@/assets/brands/louis-vuitton.png";
import loroPianaLogo from "@/assets/brands/loro-piana.png";
import jordanLogo from "@/assets/brands/jordan.png";
import hermesLogo from "@/assets/brands/hermes.png";
import diorLogo from "@/assets/brands/dior.png";
import airJordanLogo from "@/assets/brands/air-jordan.png";
import adidasLogo from "@/assets/brands/adidas.png";
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
  return <img src={logo} alt={name} className="w-full h-full object-contain" loading="lazy" onError={() => setFailed(true)} />;
});
BrandLogo.displayName = "BrandLogo";

const MobileBrandGrid = memo(({ brands: brandList }: { brands: typeof brands }) => {
  return (
    <div className="sm:hidden grid grid-cols-3 gap-2">
      {brandList.map((brand) => (
        <Link key={brand.slug} to={`/shop?brand=${brand.slug}`} className="group">
          <div className="bg-muted rounded-lg p-3 text-center transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-center mb-2">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center p-1.5">
                <BrandLogo logo={brand.logo} fallback={brand.fallback} name={brand.name} />
              </div>
            </div>
            <h3 className="text-[11px] font-heading font-semibold text-foreground tracking-tight leading-tight">{brand.name}</h3>
            <span className="text-[10px] text-muted-foreground block">{brand.count} Products</span>
          </div>
        </Link>
      ))}
    </div>
  );
});
MobileBrandGrid.displayName = "MobileBrandGrid";

const BrandCategories = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === "left" ? -260 : 260, behavior: "smooth" });
    }
  };

  return (
    <section className="pt-3 pb-6 sm:pt-4 sm:pb-10 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative">
        <MobileBrandGrid brands={brands} />

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
          className="hidden sm:flex gap-4 overflow-x-auto sm:mx-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {brands.map((brand) => (
            <Link key={brand.slug} to={`/shop?brand=${brand.slug}`} className="flex-shrink-0 w-[200px] lg:w-[220px] group">
              <div className="bg-background border border-border/40 rounded-lg p-5 h-full flex flex-col transition-all duration-300 hover:shadow-md hover:border-border">
                <h3 className="text-base font-heading font-bold text-foreground tracking-tight">{brand.name}</h3>
                <span className="text-xs text-muted-foreground mt-0.5">{brand.count} Products</span>
                <div className="flex-1 flex items-center justify-center my-5">
                  <div className="w-24 h-24 flex items-center justify-center p-2">
                    <BrandLogo logo={brand.logo} fallback={brand.fallback} name={brand.name} />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-foreground border border-border rounded-full px-4 py-1.5 inline-block self-start group-hover:bg-foreground group-hover:text-background transition-colors">
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
