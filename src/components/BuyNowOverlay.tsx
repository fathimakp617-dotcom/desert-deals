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
  const socksScrollRef = useRef<HTMLDivElement>(null);
  const kidsScrollRef = useRef<HTMLDivElement>(null);

  const buyNowItem = items.length > 0 ? items[0] : null;

  const cartIds = new Set(items.map((i) => i.product.id));
  const socksProducts = (allProducts || []).filter(
    (p) => !cartIds.has(p.id) && p.category?.toLowerCase().includes("socks") && !p.category?.toLowerCase().includes("bags")
  ).slice(0, 10);
  const kidsProducts = (allProducts || []).filter(
    (p) => !cartIds.has(p.id) && p.category?.toLowerCase().includes("kids") && !p.category?.toLowerCase().includes("bags")
  ).slice(0, 10);

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    ref.current?.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
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

                    <div className="border border-border rounded-xl mb-8 divide-y divide-border">
                      <div className="flex gap-4 p-4">
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
                      {/* Added cross-selling items appear here */}
                      {items.filter((item) => item.product.id !== buyNowItem.product.id && (item.product.category?.toLowerCase().includes("socks") || item.product.category?.toLowerCase().includes("kids"))).map((item) => (
                        <div key={item.product.id} className="flex gap-3 p-3 items-center">
                          <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground line-clamp-1">{item.product.name}</p>
                            <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <span className="text-sm font-bold text-primary whitespace-nowrap">{formatPrice(item.product.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Cross-selling - Socks Row */}
                {socksProducts.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-heading font-semibold text-foreground mb-3">Add Socks</h3>
                    <div className="relative group/scroll">
                      <button onClick={() => scrollRow(socksScrollRef, "left")} className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background border border-border rounded-full hidden sm:flex items-center justify-center shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => scrollRow(socksScrollRef, "right")} className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background border border-border rounded-full hidden sm:flex items-center justify-center shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <div ref={socksScrollRef} className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2">
                        {socksProducts.map((p) => (
                          <div key={p.id} className="flex-shrink-0 w-[130px] flex flex-col">
                            <Link to={`/product/${p.id}`} onClick={onClose} className="block">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                              </div>
                            </Link>
                            <div className="flex flex-col flex-1">
                              <Link to={`/product/${p.id}`} onClick={onClose} className="block">
                                <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug min-h-[2.5em]">{p.name}</p>
                                <p className="text-xs font-bold text-foreground mt-0.5">{formatPrice(p.crossSellPrice || p.price)}</p>
                              </Link>
                              <button onClick={() => addToCart(p.crossSellPrice ? { ...p, price: p.crossSellPrice } : p, 1)} className="mt-2 w-full text-xs font-semibold py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors">+ Add</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cross-selling - Kids Row */}
                {kidsProducts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-heading font-semibold text-foreground mb-3">Kids Shoes</h3>
                    <div className="relative group/scroll">
                      <button onClick={() => scrollRow(kidsScrollRef, "left")} className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background border border-border rounded-full hidden sm:flex items-center justify-center shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => scrollRow(kidsScrollRef, "right")} className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background border border-border rounded-full hidden sm:flex items-center justify-center shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <div ref={kidsScrollRef} className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2">
                        {kidsProducts.map((p) => (
                          <div key={p.id} className="flex-shrink-0 w-[130px] flex flex-col">
                            <Link to={`/product/${p.id}`} onClick={onClose} className="block">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                              </div>
                            </Link>
                            <div className="flex flex-col flex-1">
                              <Link to={`/product/${p.id}`} onClick={onClose} className="block">
                                <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug min-h-[2.5em]">{p.name}</p>
                                <p className="text-xs font-bold text-foreground mt-0.5">{formatPrice(p.crossSellPrice || p.price)}</p>
                              </Link>
                              <button onClick={() => addToCart(p.crossSellPrice ? { ...p, price: p.crossSellPrice } : p, 1)} className="mt-2 w-full text-xs font-semibold py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors">+ Add</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-border">
                <Button className="w-full font-heading" size="lg" onClick={handleGoToCheckout}>
                  Go to Checkout
                </Button>
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
