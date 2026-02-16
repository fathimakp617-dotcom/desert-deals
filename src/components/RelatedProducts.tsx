import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatPrice, Product } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface RelatedProductsProps {
  currentProductId: string;
  currentCategory: string;
}

const RelatedProducts = ({ currentProductId, currentCategory }: RelatedProductsProps) => {
  const { data: products = [] } = useDbProducts();
  
  const relatedProducts = products.filter((p) => p.id !== currentProductId);

  if (relatedProducts.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <h2 className="text-lg sm:text-xl font-heading font-semibold tracking-tight mb-6">
          You May Also Like
        </h2>

        {/* 2-column grid on mobile, 6-column on desktop (#2, #5) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {relatedProducts.slice(0, 12).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link to={`/product/${item.id}`} className="group block">
                <div className="bg-background border border-border/30 rounded-lg overflow-hidden">
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="block w-full bg-foreground text-background text-center text-[11px] font-medium py-2.5">
                        Select options
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] text-muted-foreground">{item.category}</span>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 mb-1 leading-snug">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.originalPrice > item.price && (
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(item.originalPrice)}</span>
                      )}
                      <span className="text-sm text-foreground">{formatPrice(item.price)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
