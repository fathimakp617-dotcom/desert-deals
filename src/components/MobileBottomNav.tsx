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
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && searchInput.trim()) handleViewAll(); }}
                className="w-full ps-10 pe-4 py-2.5 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none"
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

      <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-2 md:hidden">
        <nav className="flex items-center justify-around h-16 bg-background border border-border rounded-2xl shadow-lg">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center gap-1 text-foreground"
          >
            <Search size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-normal uppercase tracking-wider">Search</span>
          </button>

          <Link
            to="/wishlist"
            className="flex flex-col items-center gap-1 text-foreground relative"
          >
            <Heart size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-normal uppercase tracking-wider">Wishlist</span>
            {wishlistItems > 0 && (
              <span className="absolute -top-1 end-0 w-4 h-4 bg-foreground text-background text-[9px] flex items-center justify-center rounded-full">
                {wishlistItems}
              </span>
            )}
          </Link>

          <a
            href="https://wa.me/971506784405"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 text-foreground"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="text-[10px] font-normal uppercase tracking-wider">WhatsApp</span>
          </a>
        </nav>
      </div>
    </>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;
