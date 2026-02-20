import { memo, useEffect, useState } from "react";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/products";

const CartDrawer = memo(() => {
  const { items, isOpen, closeCart, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger CSS transition
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
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-card shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-heading text-lg">Cart ({totalItems})</h2>
          </div>
          <button onClick={closeCart} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Button asChild variant="outline" onClick={closeCart}>
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.product.id}-${item.selectedSize || ''}`} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <Link
                  to={`/product/${item.product.id}`}
                  onClick={closeCart}
                  className="w-16 h-16 flex-shrink-0"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product.id}`}
                    onClick={closeCart}
                    className="text-sm font-medium text-foreground line-clamp-1 hover:underline"
                  >
                    {item.product.name}
                  </Link>
                  {item.selectedSize && (
                    <p className="text-xs text-muted-foreground">Size: {item.selectedSize}</p>
                  )}
                  <p className="text-sm text-primary font-bold mt-1">
                    {formatPrice(item.product.price)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedSize)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                      className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-heading">Total</span>
              <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
            </div>
            <Button asChild className="w-full" size="lg" onClick={closeCart}>
              <Link to="/checkout">Checkout</Link>
            </Button>
            <Button asChild variant="outline" className="w-full" onClick={closeCart}>
              <Link to="/cart">View Cart</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
});

CartDrawer.displayName = "CartDrawer";

export default CartDrawer;
