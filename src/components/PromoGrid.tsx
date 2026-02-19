import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import promoGrid1 from "@/assets/banners/promo-grid-1.webp";
import promoGrid2 from "@/assets/banners/promo-grid-2.jpeg";
import nikeMindBg from "@/assets/banners/nike-mind-bg.webp";

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

  const inStock = product ? product.stock_quantity > 0 : true;
  const productImage = product?.image_url?.split(",")[0]?.trim() || promoGrid2;
  const productName = product?.name || "NM 002 Street Runner";
  const productCategory = product?.category || "All Products";
  const productPrice = product?.price ?? 379;
  const productOriginalPrice = product?.original_price ?? 1899;
  const productLink = product ? `/product/${product.id}` : "/shop";

  return (
    <section className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 h-[280px] sm:h-[350px] md:h-[420px]">
        {/* Large left image - spans 2 columns on desktop, 1 on mobile */}
        <Link to="/shop" className="col-span-1 md:col-span-2 overflow-hidden group">
          <img
            src={promoGrid1}
            alt="Nike Mind Collection"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Right product card in grey box */}
        <Link
          to={productLink}
          className="col-span-1 relative bg-muted flex flex-col items-center justify-center px-4 py-6 md:px-8 group overflow-hidden"
          style={{ backgroundImage: `url(${nikeMindBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="w-full max-w-[200px] flex flex-col items-center">
            <div className="w-full flex items-center justify-center mb-3">
              <img
                src={productImage}
                alt={productName}
                className="w-auto h-[120px] sm:h-[150px] md:h-[180px] object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = promoGrid2; }}
              />
            </div>
            <div className="w-full text-left space-y-0.5">
              <p className="text-[10px] md:text-[11px] text-muted-foreground tracking-wider uppercase">
                {productCategory}
              </p>
              <h3 className="text-xs md:text-sm font-bold text-foreground leading-snug">
                {productName}
              </h3>
              <div className="flex items-baseline gap-1.5 pt-0.5">
                <span className="text-xs md:text-sm font-semibold text-foreground">
                  {productPrice.toFixed(2)} د.إ
                </span>
                {productOriginalPrice > 0 && (
                  <span className="text-[10px] md:text-xs text-muted-foreground line-through">
                    {productOriginalPrice.toFixed(2)} د.إ
                  </span>
                )}
              </div>
              <p className={`text-[10px] md:text-[11px] font-semibold pt-0.5 ${inStock ? "text-green-600" : "text-destructive"}`}>
                {inStock ? "IN STOCK" : "OUT OF STOCK"}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default PromoGrid;
