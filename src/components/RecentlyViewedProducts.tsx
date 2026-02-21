import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import { formatPrice, Product } from "@/data/products";
import { useWishlist } from "@/contexts/WishlistContext";

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 20;

export const addToRecentlyViewed = (product: Product) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Product[];
    const filtered = stored.filter((p) => p.id !== product.id);
    filtered.unshift(product);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {}
};

const RecentlyViewedProducts = ({ currentProductId }: { currentProductId: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Product[];
      setProducts(stored.filter((p) => p.id !== currentProductId));
    } catch {}
  }, [currentProductId]);

  if (products.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="py-2 sm:py-3 bg-background">
      <div className="px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight mb-3">
          Recently Viewed
        </h2>

        <div className="relative group/scroll">
          <button
            onClick={() => scroll("left")}
            className="absolute -left-3 top-1/3 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full hidden sm:flex items-center justify-center text-foreground shadow-sm hover:bg-muted transition-colors opacity-0 group-hover/scroll:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/3 -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full hidden sm:flex items-center justify-center text-foreground shadow-sm hover:bg-muted transition-colors opacity-0 group-hover/scroll:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
          >
            {products.map((product) => {
              const inWishlist = isInWishlist(product.id);
              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group flex-shrink-0 w-[145px] sm:w-[200px] lg:w-[220px]"
                >
                  <div className="bg-background border border-border/30 rounded-lg overflow-hidden">
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
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
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase">IN STOCK</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-[10px] text-muted-foreground">4.5</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              inWishlist ? removeFromWishlist(product.id) : addToWishlist(product);
                            }}
                            className="p-0"
                          >
                            <Heart className={`w-4 h-4 ${inWishlist ? "fill-foreground text-foreground" : "text-muted-foreground"}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;
