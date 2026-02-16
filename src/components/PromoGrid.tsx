import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import promoGrid1 from "@/assets/banners/promo-grid-1.webp";

const PromoGrid = () => {
  const { data: product } = useQuery({
    queryKey: ["promo-featured-product"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, original_price, image_url, stock_quantity, category")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const inStock = product ? product.stock_quantity > 0 : false;

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Large left image - spans 2 columns on desktop */}
        <Link to="/shop" className="md:col-span-2 overflow-hidden group">
          <img
            src={promoGrid1}
            alt="Nike Mind Collection"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Right product card in grey box */}
        {product && (
          <Link
            to={`/product/${product.id}`}
            className="bg-[hsl(var(--muted))] flex flex-col items-center justify-center p-8 md:p-6 lg:p-10 group min-h-[300px] md:min-h-0"
          >
            <div className="w-full max-w-[240px] flex flex-col items-center">
              {product.image_url && (
                <div className="w-full aspect-square flex items-center justify-center mb-5">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="w-full text-left space-y-1.5">
                <p className="text-[11px] text-muted-foreground tracking-wider uppercase">
                  {product.category || "All Products"}
                </p>
                <h3 className="text-sm font-bold text-foreground leading-snug">
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-sm font-semibold text-foreground">
                    {product.price.toFixed(2)} د.إ
                  </span>
                  {product.original_price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {product.original_price.toFixed(2)} د.إ
                    </span>
                  )}
                </div>
                <p className={`text-[11px] font-semibold pt-1 ${inStock ? "text-primary" : "text-destructive"}`}>
                  {inStock ? "IN STOCK" : "OUT OF STOCK"}
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
};

export default PromoGrid;
