import { memo, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, ShoppingBag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, Product } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturesBar from "@/components/FeaturesBar";
import PageTransition from "@/components/PageTransition";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/DirectionContext";

const DEFAULT_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

const getSizes = (product: Product): number[] => {
  if (product.size) {
    const parsed = product.size.split(",").map(s => s.trim().replace(/^EU\s*/i, "")).filter(Boolean).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (parsed.length > 0) return parsed;
  }
  return DEFAULT_SIZES;
};

/** Cross-sell card with inline size picker */
const CrossSellCard = ({ product, onAdd, onBuyNow, t }: { product: Product; onAdd: (product: Product, size: number) => void; onBuyNow: (product: Product, size: number) => void; t: (key: any) => string }) => {
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const sizes = getSizes(product);

  return (
    <div className="flex-shrink-0 w-[200px] sm:w-[220px] border border-border rounded-lg p-3 bg-background snap-start">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square bg-muted rounded-md overflow-hidden mb-2">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <p className="text-xs font-semibold text-foreground line-clamp-2 uppercase leading-tight min-h-[2.4em]">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-foreground">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </Link>

      {/* Size selector */}
      <div className="mt-2">
        <p className="text-[10px] text-muted-foreground mb-1">{t("common.selectSize")}</p>
        <div className="flex flex-wrap gap-1">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`w-7 h-7 rounded-full border text-[10px] font-medium transition-all ${
                selectedSize === size
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground text-foreground"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => {
            if (!selectedSize) {
              toast.error(t("product.pleaseSelectSize"));
              return;
            }
            onAdd(product, selectedSize);
            toast.success(`${product.name} ${t("product.added")}`);
          }}
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          <Plus className="w-3 h-3" />
          {t("common.addToCart")}
        </button>
        <span className="text-muted-foreground/40">|</span>
        <button
          onClick={() => {
            if (!selectedSize) {
              toast.error(t("product.pleaseSelectSize"));
              return;
            }
            onBuyNow(product, selectedSize);
          }}
          className="flex items-center gap-1 text-xs text-foreground hover:underline font-semibold"
        >
          <ShoppingBag className="w-3 h-3" />
          {t("common.buyNow")}
        </button>
      </div>
    </div>
  );
};

const Cart = memo(() => {
  const { items, updateQuantity, removeFromCart, totalPrice, addToCart } = useCart();
  const { data: allProducts = [] } = useDbProducts();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const subtotal = totalPrice;
  const shipping = 20;
  const total = subtotal + shipping;

  const cartIds = useMemo(() => new Set(items.map(i => i.product.id)), [items]);
  const crossSellProducts = useMemo(() => {
    return allProducts.filter(p => !cartIds.has(p.id)).slice(0, 10);
  }, [allProducts, cartIds]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  const handleCrossSellAdd = (product: Product, size: number) => {
    addToCart(product, 1, `EU ${size}`);
  };

  const handleCrossSellBuyNow = (product: Product, size: number) => {
    addToCart(product, 1, `EU ${size}`);
    toast.success(`${product.name} ${t("product.added")}`);
    navigate("/checkout");
  };

  return (
    <PageTransition>
      <main className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">{t("common.home")}</Link>
            <span>›</span>
            <span className="text-foreground">{t("cart.shoppingCart")}</span>
          </nav>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-6">{t("cart.empty")}</p>
              <Button asChild variant="outline">
                <Link to="/shop">{t("cart.continueShopping")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Cart Table */}
                <div className="flex-1 min-w-0">
                  {/* Table Header */}
                  <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 pb-4 border-b border-border text-sm text-muted-foreground">
                    <span>{t("cart.product")}</span>
                    <span>{t("cart.price")}</span>
                    <span>{t("cart.quantity")}</span>
                    <span>{t("cart.subtotal")}</span>
                    <span className="w-8" />
                  </div>

                  {/* Cart Items */}
                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div
                        key={`${item.product.id}-${item.selectedSize || ''}`}
                        className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 py-6 items-center"
                      >
                        <div className="flex items-center gap-4">
                          <Link to={`/product/${item.product.id}`} className="w-16 h-16 flex-shrink-0 bg-muted overflow-hidden rounded">
                            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                          </Link>
                          <div>
                            <Link to={`/product/${item.product.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                              {item.product.name}
                            </Link>
                            {item.selectedSize && (
                              <p className="text-xs text-muted-foreground mt-0.5">{t("common.size")}: {item.selectedSize}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-foreground">
                          <span className="sm:hidden text-muted-foreground me-2">{t("cart.price")}:</span>
                          {formatPrice(item.product.price)}
                        </div>
                        <div>
                          <div className="inline-flex items-center border border-border rounded-md">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize)} className="p-2 text-foreground hover:bg-muted transition-colors">
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 text-sm font-medium min-w-[32px] text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)} className="p-2 text-foreground hover:bg-muted transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          <span className="sm:hidden text-muted-foreground me-2">{t("cart.subtotal")}:</span>
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                        <button onClick={() => removeFromCart(item.product.id, item.selectedSize)} className="p-1 text-muted-foreground hover:text-destructive transition-colors justify-self-end">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart Totals Sidebar */}
                <div className="w-full lg:w-80 flex-shrink-0">
                  <div className="border border-border rounded-lg p-6 space-y-4 sticky top-24">
                    <h3 className="text-base font-bold tracking-wider text-foreground">{t("cart.cartTotals")}</h3>
                    <div className="flex justify-between text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                      <span className="text-foreground">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground">{t("cart.shipping")}</span>
                      <span className="text-foreground">{formatPrice(shipping)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold py-2">
                      <span>{t("cart.total")}</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <Button size="lg" asChild className="w-full bg-foreground hover:bg-foreground/90 text-background py-6 text-sm tracking-widest font-medium">
                      <Link to="/checkout">{t("cart.proceedToCheckout")}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </>
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
