import { memo, useEffect, useState, useRef } from "react";
import { X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useTranslation } from "@/contexts/DirectionContext";

const CartDrawer = memo(() => {
  const { items, isOpen, closeCart, addToCart, removeFromCart, totalItems } = useCart();
  const { t } = useTranslation();
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
        className={`fixed top-0 end-0 h-full w-full max-w-md bg-card shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out ${visible ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full"}`}
      >
        {/* Close button */}
        <button onClick={closeCart} className="absolute top-3 end-3 p-1.5 hover:bg-muted rounded-full transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto p-5 pt-10">
          {/* Added to cart confirmation */}
          {lastItem && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-heading text-sm text-primary">Added to your cart</span>
            </div>
          )}

          {/* All cart items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.selectedSize || ''}`} className="flex gap-3 p-3 border border-border rounded-lg relative group">
                <Link to={`/product/${item.product.id}`} onClick={closeCart} className="w-16 h-16 flex-shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.id}`} onClick={closeCart} className="text-sm font-medium text-foreground line-clamp-2 hover:underline">
                    {item.product.name}
                  </Link>
                  {item.selectedSize && (
                    <p className="text-xs text-muted-foreground mt-0.5">Size: {item.selectedSize}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-muted"
                    aria-label="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-primary whitespace-nowrap">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Your cart is empty</p>
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
