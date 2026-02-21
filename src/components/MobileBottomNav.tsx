import { memo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, MessageCircle, X, Loader2 } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

const MobileBottomNav = memo(() => {
  const { totalItems: wishlistItems } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 250);
  const navigate = useNavigate();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["mobile-search-suggestions", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const words = debouncedSearch.split(/\s+/).filter(Boolean);
      let query = supabase
        .from("products")
        .select("id, name, price, image_url, category")
        .eq("is_active", true);
      for (const word of words) {
        query = query.ilike("name", `%${word}%`);
      }
      const { data, error } = await query.limit(6);
      if (error) throw error;
      return data || [];
    },
    enabled: debouncedSearch.length >= 1,
    staleTime: 30_000,
  });

  const handleProductClick = (id: string) => {
    setSearchOpen(false);
    setSearchInput("");
    navigate(`/product/${id}`);
  };

  const handleViewAll = () => {
    setSearchOpen(false);
    setSearchInput("");
    navigate(`/shop?search=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <>
      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && searchInput.trim()) handleViewAll(); }}
                className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            <button onClick={() => { setSearchOpen(false); setSearchInput(""); }} className="p-2 text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            {isLoading && debouncedSearch && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && suggestions && suggestions.length > 0 && (
              <>
                {suggestions.map((product) => {
                  const img = product.image_url?.split(",")[0]?.trim();
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="w-full flex items-center gap-3 py-3 border-b border-border/50 text-left"
                    >
                      {img ? (
                        <img src={img} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Search className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category} · {product.price} AED</p>
                      </div>
                    </button>
                  );
                })}
                <button onClick={handleViewAll} className="w-full py-3 text-sm text-primary font-medium text-center">
                  View all results for "{searchInput.trim()}"
                </button>
              </>
            )}
            {!isLoading && debouncedSearch && suggestions?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">No products found for "{debouncedSearch}"</p>
            )}
          </div>
        </div>
      )}

      {null}
    </>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;
