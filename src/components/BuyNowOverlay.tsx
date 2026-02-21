import { memo, useRef } from "react";
import { X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import { motion, AnimatePresence } from "framer-motion";

interface BuyNowOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuyNowOverlay = memo(({ isOpen, onClose }: BuyNowOverlayProps) => {
  const { items, addToCart, totalItems } = useCart();
  const { data: allProducts } = useDbProducts();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const buyNowItem = items.length > 0 ? items[0] : null;

  const cartIds = new Set(items.map((i) => i.product.id));
  const recommended = (allProducts || []).filter((p) => !cartIds.has(p.id)).slice(0, 10);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  const handleGoToCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Full-page panel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          >
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
              {/* Close */}
              <button onClick={onClose} className="absolute top-6 right-6 sm:top-10 sm:right-[calc(50%-220px)] p-2 hover:bg-muted rounded-full transition-colors z-10">
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-y-auto p-6 pt-8">
                {/* Confirmation */}
                {buyNowItem && (
                  <>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                      <span className="font-heading text-base text-primary">Ready to checkout</span>
                    </div>

                    <div className="flex gap-4 p-4 border border-border rounded-xl mb-8">
                      <img
                        src={buyNowItem.product.image}
                        alt={buyNowItem.product.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-2">{buyNowItem.product.name}</p>
                        {buyNowItem.selectedSize && (
                          <p className="text-xs text-muted-foreground mt-1">Size: {buyNowItem.selectedSize}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Qty: {buyNowItem.quantity}</p>
                      </div>
                      <span className="text-base font-bold text-primary whitespace-nowrap">
                        {formatPrice(buyNowItem.product.price * buyNowItem.quantity)}
                      </span>
                    </div>
                  </>
                )}

                {/* Recommended */}
                {recommended.length > 0 && (
                  <div>
                    <h3 className="font-heading text-center text-sm mb-4">Recommended for You</h3>
                    <div className="relative">
                      {recommended.length > 2 && (
                        <>
                          <button onClick={() => scroll("left")} className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-card border border-border shadow flex items-center justify-center hover:bg-muted">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button onClick={() => scroll("right")} className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-card border border-border shadow flex items-center justify-center hover:bg-muted">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-1 pb-2 snap-x">
                        {recommended.map((product) => (
                          <div key={product.id} className="flex-shrink-0 w-[160px] border border-border rounded-lg p-3 snap-start">
                            <Link to={`/product/${product.id}`} onClick={onClose} className="block">
                              <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded mx-auto mb-2" />
                              <p className="text-xs font-semibold text-foreground line-clamp-2 uppercase leading-tight">{product.name}</p>
                              <p className="text-xs font-bold text-primary mt-1">{formatPrice(product.price)}</p>
                            </Link>
                            <button
                              onClick={() => addToCart(product, 1)}
                              className="text-xs text-primary hover:underline mt-2 font-medium"
                            >
                              + Quick Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-border">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 font-heading" size="lg" onClick={onClose}>
                    Keep Shopping
                  </Button>
                  <Button className="flex-1 font-heading" size="lg" onClick={handleGoToCheckout}>
                    Go to Checkout
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

BuyNowOverlay.displayName = "BuyNowOverlay";

export default BuyNowOverlay;
