import { memo, useEffect, useState, useRef } from "react";
import { X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";

const CartDrawer = memo(() => {
  const { items, isOpen, closeCart, addToCart, totalItems } = useCart();
  const { data: allProducts } = useDbProducts();
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The most recently added item (last in the array)
  const lastItem = items.length > 0 ? items[items.length - 1] : null;

  // Recommended products: exclude items already in cart
  const cartIds = new Set(items.map((i) => i.product.id));
  const recommended = (allProducts || []).filter((p) => !cartIds.has(p.id)).slice(0, 10);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  if (!isOpen && !visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-card shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Close button */}
        <button onClick={closeCart} className="absolute top-3 right-3 p-1.5 hover:bg-muted rounded-full transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto p-5 pt-10">
          {/* Added to cart confirmation */}
          {lastItem && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="font-heading text-sm text-primary">Added to your cart</span>
              </div>

              <div className="flex gap-3 p-3 border border-border rounded-lg mb-6">
                <Link to={`/product/${lastItem.product.id}`} onClick={closeCart} className="w-16 h-16 flex-shrink-0">
                  <img src={lastItem.product.image} alt={lastItem.product.name} className="w-full h-full object-cover rounded-md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${lastItem.product.id}`} onClick={closeCart} className="text-sm font-medium text-foreground line-clamp-2 hover:underline">
                    {lastItem.product.name}
                  </Link>
                  {lastItem.selectedSize && (
                    <p className="text-xs text-muted-foreground mt-0.5">Size: {lastItem.selectedSize}</p>
                  )}
                </div>
                <span className="text-sm font-bold text-primary whitespace-nowrap">{formatPrice(lastItem.product.price)}</span>
              </div>
            </>
          )}

          {/* Recommended for You */}
          {recommended.length > 0 && (
            <div className="mt-2">
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
                      <Link to={`/product/${product.id}`} onClick={closeCart} className="block">
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

        {/* Footer buttons */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 font-heading" size="lg" onClick={closeCart}>
              Keep Shopping
            </Button>
            <Button asChild className="flex-1 font-heading" size="lg" onClick={closeCart}>
              <Link to="/cart">Go to Cart ({totalItems})</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});

CartDrawer.displayName = "CartDrawer";

export default CartDrawer;
