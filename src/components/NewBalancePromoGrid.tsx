import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import newBalanceAd from "@/assets/banners/new-balance-ad.jpeg";

const NewBalancePromoGrid = () => {
  const { data: product } = useQuery({
    queryKey: ["new-balance-featured-product"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, original_price, image_url, stock_quantity, category")
        .eq("is_active", true)
        .ilike("name", "%new balance%")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const inStock = product ? product.stock_quantity > 0 : true;
  const productImage = product?.image_url?.split(",")[0]?.trim() || newBalanceAd;
  const productName = product?.name || "New Balance 9060";
  const productCategory = product?.category || "New Balance";
  const productPrice = product?.price ?? 399;
  const productOriginalPrice = product?.original_price ?? 1299;
  const productLink = product ? `/product/${product.id}` : "/shop?brand=new-balance";

  return (
    <section className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 h-[280px] sm:h-[350px] md:h-[420px]">
        {/* Large left image */}
        <Link to="/shop?brand=new-balance" className="col-span-1 md:col-span-2 overflow-hidden group">
          <img
            src={newBalanceAd}
            alt="New Balance Collection"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Right product card */}
        <Link
          to={productLink}
          className="col-span-1 bg-muted flex flex-col items-center justify-center px-4 py-6 md:px-8 group"
        >
          <div className="w-full max-w-[200px] flex flex-col items-center">
            <div className="w-full flex items-center justify-center mb-3">
              <img
                src={productImage}
                alt={productName}
                className="w-auto h-[120px] sm:h-[150px] md:h-[180px] object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = newBalanceAd; }}
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

export default NewBalancePromoGrid;
