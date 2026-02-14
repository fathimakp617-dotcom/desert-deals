import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { formatPrice } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useWishlist } from "@/contexts/WishlistContext";
import { Badge } from "@/components/ui/badge";
import { useProductStock, isProductSoldOut } from "@/hooks/useProductStock";
import { Loader2 } from "lucide-react";

const TopSellers = memo(() => {
  const { data: products = [], isLoading } = useDbProducts();
  const { data: stockMap } = useProductStock();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="collection" className="py-10 sm:py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-foreground">
            Top Sellers
          </h2>
          <Link
            to="/shop"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="relative">
            {/* Arrows */}
            <button
              onClick={() => scroll("left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-sm hidden sm:flex"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Product carousel */}
            <div
              ref={scrollRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {products.map((product) => {
                const soldOut = isProductSoldOut(stockMap, product.id);
                const inWishlist = isInWishlist(product.id);

                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-[220px] sm:w-[260px] group"
                  >
                    {/* Product Image */}
                    <div className="relative overflow-hidden rounded-lg bg-muted aspect-square mb-3">
                      <Link to={`/product/${product.id}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                            soldOut ? "opacity-60" : ""
                          }`}
                          loading="lazy"
                        />
                      </Link>

                      {/* Sold out badge */}
                      {soldOut && (
                        <Badge
                          variant="destructive"
                          className="absolute top-2 left-2 text-xs"
                        >
                          SOLD OUT
                        </Badge>
                      )}

                      {/* Discount badge */}
                      {product.discountPercent > 0 && !soldOut && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs border-0">
                          -{product.discountPercent}%
                        </Badge>
                      )}

                      {/* Wishlist button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (inWishlist) {
                            removeFromWishlist(product.id);
                          } else {
                            addToWishlist(product);
                          }
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            inWishlist
                              ? "fill-red-500 text-red-500"
                              : "text-foreground"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Product Info */}
                    <Link to={`/product/${product.id}`}>
                      <p className="text-xs text-muted-foreground mb-1">
                        {product.category}
                      </p>
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-foreground">
                          {formatPrice(product.price)}
                        </span>
                      </div>

                      {/* Stock status */}
                      {!soldOut && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">
                          In Stock
                        </p>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

TopSellers.displayName = "TopSellers";

export default TopSellers;
