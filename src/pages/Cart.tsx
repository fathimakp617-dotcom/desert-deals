import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/products";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturesBar from "@/components/FeaturesBar";
import PageTransition from "@/components/PageTransition";

const Cart = memo(() => {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  const subtotal = totalPrice;
  const shipping = 20;
  const total = subtotal + shipping;

  return (
    <PageTransition>
      <main className="min-h-screen bg-background">
        <Navbar />

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>›</span>
            <span className="text-foreground">Cart</span>
          </nav>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-6">Your cart is empty</p>
              <Button asChild variant="outline">
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Table */}
              <div className="flex-1">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 pb-4 border-b border-border text-sm text-muted-foreground">
                  <span>Product</span>
                  <span>Price</span>
                  <span>Quantity</span>
                  <span>Subtotal</span>
                  <span className="w-8" />
                </div>

                {/* Cart Items */}
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 py-6 items-center"
                    >
                      {/* Product */}
                      <div className="flex items-center gap-4">
                        <Link to={`/product/${item.product.id}`} className="w-16 h-16 flex-shrink-0 bg-muted overflow-hidden rounded">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        <Link to={`/product/${item.product.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                          {item.product.name}
                        </Link>
                      </div>

                      {/* Price */}
                      <div className="text-sm text-foreground">
                        <span className="sm:hidden text-muted-foreground mr-2">Price:</span>
                        {formatPrice(item.product.price)}
                      </div>

                      {/* Quantity */}
                      <div>
                        <div className="inline-flex items-center border border-border rounded-md">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-2 text-foreground hover:bg-muted transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-3 text-sm font-medium min-w-[32px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-2 text-foreground hover:bg-muted transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-sm font-medium text-foreground">
                        <span className="sm:hidden text-muted-foreground mr-2">Subtotal:</span>
                        {formatPrice(item.product.price * item.quantity)}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors justify-self-end"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

              </div>

              {/* Cart Totals Sidebar */}
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="border border-border rounded-lg p-6 space-y-4 sticky top-24">
                  <h3 className="text-base font-bold tracking-wider text-foreground">CART TOTALS</h3>

                  <div className="flex justify-between text-sm py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground">{formatPrice(shipping)}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold py-2">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>

                  <Button
                    size="lg"
                    asChild
                    className="w-full bg-foreground hover:bg-foreground/90 text-background py-6 text-sm tracking-widest font-medium"
                  >
                    <Link to="/checkout">Proceed to checkout</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <FeaturesBar />
        <Footer />
      </main>
    </PageTransition>
  );
});

Cart.displayName = "Cart";

export default Cart;
