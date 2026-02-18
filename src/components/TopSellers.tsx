import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { formatPrice } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useWishlist } from "@/contexts/WishlistContext";
import { Badge } from "@/components/ui/badge";
import { useProductStock, isProductSoldOut } from "@/hooks/useProductStock";
import { Loader2 } from "lucide-react";

// Matches the "Top Sellers" product-tab-carousel from the original HTML
const TopSellers = memo(() => {
  const { data: products = [], isLoading } = useDbProducts();
  const { data: stockMap } = useProductStock();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
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
    <section id="collection" className="py-6 sm:py-10 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        {/* Module header - matches site-module-header with tabs */}
        <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
          <div className="flex items-center gap-6">
            <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
              Our Collection
            </h3>
          </div>
          <Link
            to="/shop"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
            {/* Navigation arrows */}
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

            {/* Product carousel - matches product-type-1 layout */}
            <div
              ref={scrollRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {products.map((product) => {
                const soldOut = isProductSoldOut(stockMap, product.id);
                const inWishlist = isInWishlist(product.id);

                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-[180px] sm:w-[220px] lg:w-[246px] group"
                  >
                    {/* Product card - matches product-wrapper product-background */}
                    <div className="bg-background border border-border/30 rounded-lg overflow-hidden">
                      {/* Product thumbnail */}
                      <div className="relative aspect-square bg-muted overflow-hidden">
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


                        {/* Sold out */}
                        {soldOut && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="destructive" className="text-[10px]">
                              SOLD OUT
                            </Badge>
                          </div>
                        )}

                        {/* Wishlist button - matches product-wishlist */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (inWishlist) {
                              removeFromWishlist(product.id);
                            } else {
                              addToWishlist(product);
                            }
                          }}
                          className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow opacity-0 group-hover:opacity-100"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              inWishlist
                                ? "fill-red-500 text-red-500"
                                : "text-foreground"
                            }`}
                          />
                        </button>

                        {/* Select options button - matches product-cart-button */}
                        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/product/${product.id}`}
                            className="block w-full bg-foreground text-background text-center text-[11px] font-medium py-2.5 hover:bg-foreground/90 transition-colors"
                          >
                            Select options
                          </Link>
                        </div>
                      </div>

                      {/* Product content - matches product-content-wrapper */}
                      <div className="p-3 sm:p-4 bg-muted rounded-b-lg">
                        {/* Brand tags - matches product-brand */}
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            {product.category}
                          </span>
                        </div>

                        {/* Product title - matches product-title */}
                        <Link to={`/product/${product.id}`}>
                          <h2 className="text-[13px] sm:text-sm font-bold text-foreground line-clamp-2 mb-1.5 leading-snug hover:text-primary transition-colors">
                            {product.name}
                          </h2>
                        </Link>

                        {/* Price - matches WooCommerce price display with د.إ */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {product.originalPrice > product.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                          <span className="text-sm text-foreground">
                            {formatPrice(product.price)}
                          </span>
                        </div>

                        {/* Stock status - matches product-stock text-green-600 */}
                        <div className="mt-2 flex items-center gap-1.5">
                          {soldOut ? (
                            <span className="text-[11px] font-bold text-red-500 uppercase">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 uppercase">
                              In Stock
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (inWishlist) {
                                removeFromWishlist(product.id);
                              } else {
                                addToWishlist(product);
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center"
                          >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${inWishlist ? "fill-foreground text-foreground" : "text-muted-foreground"}`} />
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
    </section>
  );
});

TopSellers.displayName = "TopSellers";

export default TopSellers;
