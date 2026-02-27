import { memo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, ImageOff, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/data/products";
import { usePrefetchProduct } from "@/hooks/useDbProducts";
import type { SimpleProduct } from "@/hooks/usePaginatedProducts";


interface ProductCardProps {
  product: SimpleProduct;
  soldOut: boolean;
  inWishlist: boolean;
  onToggleWishlist: (id: string) => void;
  onQuickView?: (id: string) => void;
  viewMode: "grid" | "list";
}

const ProductCard = memo(({ product, soldOut, inWishlist, onToggleWishlist, onQuickView, viewMode }: ProductCardProps) => {
  const [imgError, setImgError] = useState(false);
  const prefetch = usePrefetchProduct();
  const handlePrefetch = useCallback(() => prefetch(product.id), [prefetch, product.id]);

  if (viewMode === "list") {
    return (
      <div className="flex flex-col md:flex-row gap-4 border border-border/50 bg-card/50 p-4 hover:border-primary/30 transition-colors" onMouseEnter={handlePrefetch} onTouchStart={handlePrefetch}>
        <Link to={`/product/${product.id}`} className="w-full md:w-40 h-40 flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center">
          {imgError ? (
            <ImageOff className="w-8 h-8 text-muted-foreground" />
          ) : (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { setImgError(true); (e.target as HTMLImageElement).src = "/images/product-placeholder.jpg"; }} />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          
          <Link to={`/product/${product.id}`}>
            <h3 className="text-base font-heading font-bold mt-1 text-foreground hover:text-primary transition-colors truncate">{product.name}</h3>
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-base text-foreground">{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
          <div className="mt-1.5">
            {soldOut ? (
              <span className="text-[11px] font-bold text-red-500 uppercase">Out of Stock</span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-600 uppercase">IN STOCK</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-background border border-border/30 rounded-lg overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20" onMouseEnter={handlePrefetch} onTouchStart={handlePrefetch}>
      <div className="relative aspect-square bg-muted overflow-hidden flex-shrink-0">
        <Link to={`/product/${product.id}`} className="w-full h-full flex items-center justify-center">
          {imgError ? (
            <ImageOff className="w-10 h-10 text-muted-foreground" />
          ) : (
            <img
              src={product.image}
              alt={product.name}
              width={250}
              height={250}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${soldOut ? "opacity-60" : ""}`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                setImgError(true);
                (e.target as HTMLImageElement).src = "/images/product-placeholder.jpg";
              }}
            />
          )}
        </Link>




        {soldOut && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="text-[10px]">SOLD OUT</Badge>
          </div>
        )}

        {onQuickView && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product.id); }}
            className="absolute bottom-2 right-12 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Eye className="w-3.5 h-3.5 text-foreground" />
          </button>
        )}

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product.id); }}
          className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-red-500 text-red-500" : "text-foreground"}`} />
        </button>

      </div>

      {/* Product info - #6: Name bold, stock status, adjusted font sizes */}
      <div className="p-3 bg-muted rounded-b-lg flex-1 flex flex-col">
        <Link to={`/product/${product.id}`}>
          <h2 className="text-[13px] sm:text-sm font-bold text-foreground line-clamp-2 mb-1.5 leading-snug hover:text-primary transition-colors min-h-[2.5em]">
            {product.name}
          </h2>
        </Link>
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
          <span className="text-[13px] text-foreground">{formatPrice(product.price)}</span>
        </div>
        <div className="mt-auto pt-1.5 flex items-center gap-1.5">
          {soldOut ? (
            <span className="text-[11px] font-bold text-red-500 uppercase">Out of Stock</span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-600 uppercase">IN STOCK</span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product.id); }}
            className="w-5 h-5 flex items-center justify-center"
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${inWishlist ? "fill-foreground text-foreground" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
