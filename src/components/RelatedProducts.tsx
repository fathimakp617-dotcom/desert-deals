import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, Product } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useWishlist } from "@/contexts/WishlistContext";
import { Heart, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import QuickViewDialog from "@/components/QuickViewDialog";

interface RelatedProductsProps {
  currentProductId: string;
  currentCategory: string;
}

const RelatedProducts = ({ currentProductId, currentCategory }: RelatedProductsProps) => {
  const { data: products = [] } = useDbProducts();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  // Show socks and kids products as cross-selling items
  const relatedProducts = products.filter(
    (p) => p.id !== currentProductId && (p.category?.toLowerCase().includes("socks") || p.category?.toLowerCase().includes("kids"))
  );

  if (relatedProducts.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="py-2 sm:py-3 bg-background">
      <div className="px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight mb-6">
          Complete Your Look
        </h2>

        <div className="relative group/scroll">
          <button onClick={() => scroll("left")} className="absolute -left-3 top-1/3 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full hidden sm:flex items-center justify-center text-foreground shadow-sm hover:bg-muted transition-colors opacity-0 group-hover/scroll:opacity-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="absolute -right-3 top-1/3 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full hidden sm:flex items-center justify-center text-foreground shadow-sm hover:bg-muted transition-colors opacity-0 group-hover/scroll:opacity-100">
            <ChevronRight className="w-4 h-4" />
          </button>

          <div ref={scrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2">
            {relatedProducts.slice(0, 12).map((item) => {
              const inWishlist = isInWishlist(item.id);
              return (
                <div key={item.id} className="group flex-shrink-0 w-[145px] sm:w-[200px] lg:w-[220px]">
                  <div className="bg-background border border-border/30 rounded-lg overflow-hidden">
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <Link to={`/product/${item.id}`}>
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      </Link>

                      {/* Quick view */}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewId(item.id); }}
                        className="absolute bottom-2 right-12 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="w-3.5 h-3.5 text-foreground" />
                      </button>

                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); inWishlist ? removeFromWishlist(item.id) : addToWishlist(item); }}
                        className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-red-500 text-red-500" : "text-foreground"}`} />
                      </button>
                    </div>
                    <div className="p-3">
                      <span className="text-[10px] text-muted-foreground uppercase">{item.category}</span>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 min-h-[2.5em] leading-snug mt-0.5">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="text-sm font-medium text-foreground">{formatPrice(item.price)}</span>
                        {item.originalPrice > item.price && (
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(item.originalPrice)}</span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase">IN STOCK</span>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); inWishlist ? removeFromWishlist(item.id) : addToWishlist(item); }} className="p-0">
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
      </div>

      <QuickViewDialog productId={quickViewId} open={!!quickViewId} onOpenChange={(open) => { if (!open) setQuickViewId(null); }} />
    </section>
  );
};

export default RelatedProducts;
