import { forwardRef, memo } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/data/products";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Loader2 } from "lucide-react";

const excludedCategories = ["socks", "heels", "bags", "jersey", "kids"];

const Collection = forwardRef<HTMLDivElement>((_, ref) => {
  const { data: featuredProducts = [], isLoading } = useQuery({
    queryKey: ["collection-newest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, original_price, discount_percent, category, image_url, stock_quantity")
        .eq("is_active", true)
        .is("deleted_at", null)
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || [])
        .filter(p => p.image_url && !excludedCategories.some(c => (p.category || "").toLowerCase().includes(c)))
        .slice(0, 3)
        .map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.original_price || p.price,
          image: (p.image_url || "").split(",")[0]?.trim(),
          tagline: (p.category || "").split(",")[0]?.trim() || "",
          _stock: p.stock_quantity,
        }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  

  return (
    <section ref={ref} id="collection" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(35_49%_44%_/_0.02)_0%,_transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative">
        <div className="text-center mb-16 sm:mb-20">
          <p className="text-sm tracking-[0.4em] text-primary mb-4">DISCOVER</p>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading tracking-tight">Our Collection</h2>
          <div className="w-20 h-0.5 bg-primary mx-auto mt-6" />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group">
                <Link to={`/product/${product.id}`}>
                  <div className="relative overflow-hidden border border-border/50 bg-card/50 p-6 sm:p-8 transition-all duration-500 hover:border-primary/50 hover:bg-card">
                    <div className="absolute top-0 start-0 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-s-2 border-primary/60" />
                    <div className="absolute top-0 end-0 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-e-2 border-primary/60" />
                    <div className="absolute bottom-0 start-0 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-s-2 border-primary/60" />
                    <div className="absolute bottom-0 end-0 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-e-2 border-primary/60" />

                    <div className="relative aspect-square mb-6 overflow-hidden">
                      {((product as any)._stock ?? 1) === 0 && (
                        <div className="absolute top-2 end-2 z-10">
                          <Badge variant="destructive" className="text-xs font-semibold">SOLD OUT</Badge>
                        </div>
                      )}
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${((product as any)._stock ?? 1) === 0 ? 'opacity-60' : ''}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    <div className="text-center">
                      <h3 className="text-xl sm:text-2xl font-heading tracking-[0.2em] mb-2 text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground tracking-wider mb-4">{product.tagline}</p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="text-lg sm:text-xl text-primary font-medium">{formatPrice(product.price)}</span>
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center mt-12 sm:mt-16">
          <Link 
            to="/shop" 
            className="relative inline-block px-10 sm:px-12 py-4 bg-primary text-primary-foreground text-sm tracking-widest transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
          >
            VIEW ALL PRODUCTS
          </Link>
        </div>
      </div>
    </section>
  );
});

Collection.displayName = "Collection";

export default memo(Collection);
