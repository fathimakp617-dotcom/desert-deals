import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Zap, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { formatPrice, Product } from "@/data/products";
import { useDbProduct } from "@/hooks/useDbProducts";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useProductStock, isProductSoldOut } from "@/hooks/useProductStock";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { trackAddToCart } from "@/lib/metaPixel";
import useEmblaCarousel from "embla-carousel-react";
import BuyNowOverlay from "@/components/BuyNowOverlay";
import Mind001SizeWarning, { isMind001 } from "@/components/Mind001SizeWarning";

interface QuickViewDialogProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickViewDialog = ({ productId, open, onOpenChange }: QuickViewDialogProps) => {
  const { data: product, isLoading } = useDbProduct(productId || undefined);
  const { addToCart, buyNow } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { data: stockMap } = useProductStock();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showBuyNow, setShowBuyNow] = useState(false);
  const [imgError, setImgError] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const isSoldOut = isProductSoldOut(stockMap, productId || "");
  const inWishlist = product ? isInWishlist(product.id) : false;

  const parseSizes = (sizeStr: string): string[] => {
    const match = sizeStr.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);
      const sizes: string[] = [];
      for (let i = start; i <= end; i++) sizes.push(`EU ${i}`);
      return sizes;
    }
    return sizeStr.split(",").map(s => s.trim()).filter(Boolean);
  };

  const [showMind001Warning, setShowMind001Warning] = useState(false);

  const handleAddToCart = () => {
    if (!product || isSoldOut) return;
    if (!selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    addToCart(product, quantity, selectedSize);
    trackAddToCart({ content_ids: [product.id], value: product.price * quantity, currency: "AED" });
    toast.success(`${product.name} added to cart`, { description: `Size: ${selectedSize} · Qty: ${quantity}` });
    if (isMind001(product.name)) {
      setShowMind001Warning(true);
    }
  };

  const handleBuyNow = () => {
    if (!product || isSoldOut) return;
    if (!selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    buyNow(product, quantity, selectedSize);
    if (isMind001(product.name)) {
      setShowMind001Warning(true);
    } else {
      setShowBuyNow(true);
    }
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product);
    toast.success(inWishlist ? `Removed from wishlist` : `Added to wishlist`);
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {isLoading || !product ? (
            <div className="p-8 flex items-center justify-center min-h-[300px]">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="relative aspect-square bg-muted overflow-hidden">
                {product.gallery.length > 1 ? (
                  <>
                    <button
                      onClick={() => emblaApi?.scrollPrev()}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => emblaApi?.scrollNext()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="overflow-hidden h-full" ref={emblaRef}>
                      <div className="flex h-full">
                        {product.gallery.map((img, idx) => (
                          <div key={idx} className="flex-[0_0_100%] min-w-0 h-full">
                            <img src={img} alt={product.name} className="w-full h-full object-contain bg-white" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  imgError ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-12 h-12 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain bg-white"
                      onError={() => setImgError(true)}
                    />
                  )
                )}

                {isSoldOut && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">SOLD OUT</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-5 sm:p-6 flex flex-col gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-medium tracking-tight">{product.name}</h2>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl sm:text-2xl font-light">{formatPrice(product.price)}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                  <div className="mt-1.5">
                    {isSoldOut ? (
                      <span className="text-xs font-bold text-red-500">OUT OF STOCK</span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600">IN STOCK</span>
                    )}
                  </div>
                </div>

                {/* Size selector */}
                <div>
                  <span className="text-sm text-muted-foreground">Size</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parseSizes(product.size).map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-11 h-9 px-2 text-sm border rounded transition-colors ${
                          selectedSize === size
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        {size.replace(/^EU\s*/i, "")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity + Add to cart */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={isSoldOut}
                    className="flex-1 h-10 gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to cart
                  </Button>
                </div>

                {/* Buy now + wishlist */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBuyNow}
                    disabled={isSoldOut}
                    className="flex-1 h-10 gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Buy Now
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={handleToggleWishlist}
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                </div>

                {/* View full details link */}
                <Link
                  to={`/product/${product.id}`}
                  onClick={() => onOpenChange(false)}
                  className="text-sm text-primary hover:underline mt-auto"
                >
                  View full details →
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showBuyNow && product && (
        <BuyNowOverlay isOpen={showBuyNow} onClose={() => setShowBuyNow(false)} />
      )}
      <Mind001SizeWarning open={showMind001Warning} onClose={() => setShowMind001Warning(false)} />
    </>
  );
};

export default QuickViewDialog;
