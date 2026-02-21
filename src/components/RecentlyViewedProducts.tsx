import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-heading font-semibold text-foreground">
            Recently Viewed
          </h3>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 top-[35%] -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 top-[35%] -translate-y-1/2 z-10 w-9 h-9 bg-background border border-border rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product) => {
              const inWishlist = isInWishlist(product.id);
              return (
                <div key={product.id} className="flex-shrink-0 w-[145px] sm:w-[220px] lg:w-[246px] group">
                  <div className="bg-background border border-border/30 rounded-lg overflow-hidden flex flex-col h-full">
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <Link to={`/product/${product.id}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          inWishlist ? removeFromWishlist(product.id) : addToWishlist(product);
                        }}
                        className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow opacity-0 group-hover:opacity-100"
                      >
                        <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-red-500 text-red-500" : "text-foreground"}`} />
                      </button>
                    </div>
                    <div className="p-3 sm:p-4 bg-muted rounded-b-lg flex-1 flex flex-col">
                      <Link to={`/product/${product.id}`}>
                        <h2 className="text-[13px] sm:text-sm font-bold text-foreground line-clamp-2 mb-1.5 leading-snug hover:text-primary transition-colors min-h-[2.5em]">
                          {product.name}
                        </h2>
                      </Link>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                        <span className="text-sm text-foreground">{formatPrice(product.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;
