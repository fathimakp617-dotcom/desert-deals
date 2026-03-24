import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (productName: string) => void;
  onClose: () => void;
}

const SearchSuggestions = ({ query, onSelect, onClose }: SearchSuggestionsProps) => {
  const debouncedQuery = useDebounce(query.trim(), 250);
  const navigate = useNavigate();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["search-suggestions", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      // Split query into words and search each word to handle extra spaces in product names
      const words = debouncedQuery.split(/\s+/).filter(Boolean);
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
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
  });

  if (!query.trim()) return null;

  const handleClick = (product: { id: string; name: string }) => {
    onClose();
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : suggestions && suggestions.length > 0 ? (
        <>
          {suggestions.map((product) => {
            const img = product.image_url?.split(",")[0]?.trim();
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleClick(product)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
              >
                {img ? (
                  <img
                    src={img}
                    alt={product.name}
                    className="w-10 h-10 rounded-md object-contain bg-white shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.category} · {product.price} AED
                  </p>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              onSelect(query);
            }}
            className="w-full px-4 py-2.5 text-xs text-primary font-medium hover:bg-accent/50 transition-colors border-t border-border"
          >
            View all results for "{query.trim()}"
          </button>
        </>
      ) : debouncedQuery.length >= 1 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No products found for "{debouncedQuery}"
        </div>
      ) : null}
    </div>
  );
};

export default SearchSuggestions;
