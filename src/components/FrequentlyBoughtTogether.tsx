import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/DirectionContext";
import { formatPrice, Product } from "@/data/products";
import { toast } from "sonner";

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
}

const FrequentlyBoughtTogether = ({ currentProduct }: FrequentlyBoughtTogetherProps) => {
  const { data: allProducts = [] } = useDbProducts();
  const { addToCart } = useCart();
  const { t } = useTranslation();

  // Pick 2 products from same category (or random) as cross-sell
  const crossSellProducts = useMemo(() => {
    const sameCategory = allProducts.filter(
      (p) => p.id !== currentProduct.id && p.category === currentProduct.category
    );
    const others = allProducts.filter(
      (p) => p.id !== currentProduct.id && p.category !== currentProduct.category
    );
    const pool = sameCategory.length >= 2 ? sameCategory : [...sameCategory, ...others];
    // Seeded shuffle based on product id
    let h = 0;
    for (let i = 0; i < currentProduct.id.length; i++)
      h = ((h << 5) - h + currentProduct.id.charCodeAt(i)) | 0;
    const seed = Math.abs(h);
    const shuffled = [...pool].sort((a, b) => {
      const ha = (seed ^ a.id.length) % 1000;
      const hb = (seed ^ b.id.length) % 1000;
      return ha - hb;
    });
    return shuffled.slice(0, 2);
  }, [allProducts, currentProduct.id, currentProduct.category]);

  if (crossSellProducts.length === 0) return null;

  const bundleItems = [currentProduct, ...crossSellProducts];
  const bundleTotal = bundleItems.reduce((sum, p) => sum + p.price, 0);
  const bundleOriginal = bundleItems.reduce((sum, p) => sum + p.originalPrice, 0);

  const handleAddAllToCart = () => {
    bundleItems.forEach((product) => addToCart(product, 1));
    toast.success(`${bundleItems.length} items added to cart!`);
  };

  return (
    <section className="py-10 sm:py-14">
      <div className="px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight mb-6">
          Frequently Bought Together
        </h2>

        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
          {/* Products row */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {bundleItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 sm:gap-3">
                <Link
                  to={`/product/${item.id}`}
                  className="group border border-border rounded-lg p-3 bg-background hover:border-primary/40 transition-colors w-[130px] sm:w-[160px]"
                >
                  <div className="aspect-square bg-white rounded-md overflow-hidden mb-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight min-h-[2.4em]">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-bold text-foreground">{formatPrice(item.price)}</span>
                    {item.originalPrice > item.price && (
                      <span className="text-[10px] text-muted-foreground line-through">{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] text-primary font-medium mt-0.5 block">This item</span>
                  )}
                </Link>
                {idx < bundleItems.length - 1 && (
                  <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bundle total + CTA */}
          <div className="border border-border rounded-lg p-4 sm:p-5 bg-muted/30 lg:self-center w-full lg:w-auto lg:min-w-[220px]">
            <p className="text-sm text-muted-foreground mb-1">Bundle Price</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-foreground">{formatPrice(bundleTotal)}</span>
              {bundleOriginal > bundleTotal && (
                <span className="text-sm text-muted-foreground line-through">{formatPrice(bundleOriginal)}</span>
              )}
            </div>
            {bundleOriginal > bundleTotal && (
              <p className="text-xs text-emerald-600 font-medium mb-3">
                Save {formatPrice(bundleOriginal - bundleTotal)}
              </p>
            )}
            <Button onClick={handleAddAllToCart} className="w-full font-heading gap-2" size="lg">
              <ShoppingBag className="w-4 h-4" />
              Add All to Cart
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FrequentlyBoughtTogether;
