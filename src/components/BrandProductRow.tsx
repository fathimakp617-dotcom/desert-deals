import { memo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart, Eye } from "lucide-react";
import { formatPrice } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useWishlist } from "@/contexts/WishlistContext";
import { Badge } from "@/components/ui/badge";
import { useProductStock, isProductSoldOut } from "@/hooks/useProductStock";
import { Loader2 } from "lucide-react";
import QuickViewDialog from "@/components/QuickViewDialog";

interface BrandProductRowProps {
  brand: string;
  title: string;
  shopLink?: string;
}

const BrandProductRow = memo(({ brand, title, shopLink }: BrandProductRowProps) => {
  const { data: allProducts = [], isLoading } = useDbProducts();
  const { data: stockMap } = useProductStock();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  const brandLower = brand.toLowerCase();
  const products = brandLower
    ? allProducts.filter(
        (p) =>
          p.category?.toLowerCase() === brandLower ||
          p.name?.toLowerCase().includes(brandLower)
      )
    : allProducts;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -280 : 280,
        behavior: "smooth",
      });
    }
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-2 sm:py-3 bg-background">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">{title}</h3>
          <Link to={shopLink || `/shop?brand=${brand.toLowerCase()}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="relative group/scroll">
            <button onClick={() => scroll("left")} className="absolute -left-3 top-1/3 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full hidden sm:flex items-center justify-center text-foreground shadow-sm hover:bg-muted transition-colors opacity-0 group-hover/scroll:opacity-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scroll("right")} className="absolute -right-3 top-1/3 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full hidden sm:flex items-center justify-center text-foreground shadow-sm hover:bg-muted transition-colors opacity-0 group-hover/scroll:opacity-100">
              <ChevronRight className="w-4 h-4" />
            </button>

            <div ref={scrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2">
              {products.map((product) => {
                const soldOut = isProductSoldOut(stockMap, product.id);
                const inWishlist = isInWishlist(product.id);

                return (
                  <div key={product.id} className="group flex-shrink-0 w-[145px] sm:w-[200px] lg:w-[220px]">
                    <div className="bg-background border border-border/30 rounded-lg overflow-hidden">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        <Link to={`/product/${product.id}`}>
                          <img
                            src={product.image}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${soldOut ? "opacity-60" : ""}`}
                            loading="lazy"
                          />
                        </Link>
                        {soldOut && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="destructive" className="text-[10px]">SOLD OUT</Badge>
                          </div>
                        )}

                        {/* Quick view */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewId(product.id); }}
                          className="absolute bottom-2 right-12 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-3.5 h-3.5 text-foreground" />
                        </button>

                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); inWishlist ? removeFromWishlist(product.id) : addToWishlist(product); }}
                          className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-red-500 text-red-500" : "text-foreground"}`} />
                        </button>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] text-muted-foreground uppercase">{product.category}</span>
                        <h2 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 min-h-[2.5em] leading-snug mt-0.5">
                          {product.name}
                        </h2>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <span className="text-sm font-medium text-foreground">{formatPrice(product.price)}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          {soldOut ? (
                            <span className="text-[11px] font-bold text-red-500 uppercase">Out of Stock</span>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 uppercase">IN STOCK</span>
                          )}
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); inWishlist ? removeFromWishlist(product.id) : addToWishlist(product); }} className="p-0">
                            <Heart className={`w-4 h-4 ${inWishlist ? "fill-foreground text-foreground" : "text-muted-foreground"}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <QuickViewDialog productId={quickViewId} open={!!quickViewId} onOpenChange={(open) => { if (!open) setQuickViewId(null); }} />
    </section>
  );
});

BrandProductRow.displayName = "BrandProductRow";

export default BrandProductRow;
