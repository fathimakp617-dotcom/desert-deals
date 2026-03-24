import { memo, useEffect, useState } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/products";
import { useTranslation } from "@/contexts/DirectionContext";
import { CouponInput } from "@/components/CouponInput";

const CartDrawer = memo(() => {
  const { items, isOpen, closeCart, updateQuantity, removeFromCart, totalItems, totalPrice } = useCart();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-heading font-bold text-foreground">
            {t("cart.title") || "Cart"} <span className="text-muted-foreground font-normal text-base">{totalItems}</span>
          </h2>
          <button onClick={closeCart} className="p-1.5 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">{t("cart.empty")}</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.selectedSize || ''}`} className="flex gap-3">
                  <Link to={`/product/${item.product.id}`} onClick={closeCart} className="w-20 h-20 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/product/${item.product.id}`} onClick={closeCart} className="text-sm font-medium text-foreground line-clamp-2 hover:underline">
                          {item.product.name}
                        </Link>
                        {item.selectedSize && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.selectedSize}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>

                    {/* Price per item if discounted */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatPrice(item.product.price)}</span>
                      {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(item.product.originalPrice)}</span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize)}
                          className="p-1.5 hover:bg-muted transition-colors rounded-s-lg"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                          className="p-1.5 hover:bg-muted transition-colors rounded-e-lg"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            {/* Discount section */}
            <CouponInput />

            {/* Estimated total */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-foreground">{t("cart.estimatedTotal") || "Estimated total"}</span>
              <span className="text-base font-bold text-foreground">{formatPrice(totalPrice)} AED</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("cart.taxesNote") || "Taxes and shipping calculated at checkout."}</p>

            {/* Checkout button */}
            <Button asChild className="w-full font-heading" size="lg" onClick={closeCart}>
              <Link to="/checkout">{t("cart.checkout") || "Check out"}</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
});

CartDrawer.displayName = "CartDrawer";

export default CartDrawer;
