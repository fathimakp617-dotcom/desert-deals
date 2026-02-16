import { useState, useEffect, useCallback, memo } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Grid3X3, List, Filter, X, ChevronDown, ChevronLeft, ChevronRight, Loader2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { CollectionPageSchema } from "@/components/seo/JsonLd";
import { useWishlist } from "@/contexts/WishlistContext";
import { useProductStock, isProductSoldOut } from "@/hooks/useProductStock";
import { useDebounce } from "@/hooks/useDebounce";
import { usePaginatedProducts } from "@/hooks/usePaginatedProducts";
import ProductCard from "@/components/ProductCard";


const categories = [
  "All", "Nike", "Jordan", "New Balance", "On Cloud", "Asics", "Adidas",
  "Hoka", "Puma", "Louis Vuitton", "Gucci", "Onitsuka Tiger", "Loro Piana",
  "Brooks", "Dior", "Basketball Shoes",
];
const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under AED 200", min: 0, max: 200 },
  { label: "AED 200 - AED 350", min: 200, max: 350 },
  { label: "AED 350 - AED 500", min: 350, max: 500 },
  { label: "Above AED 500", min: 500, max: Infinity },
];
const sortOptions = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A-Z", value: "name-asc" },
];

const brandSlugToCategory: Record<string, string> = {
  "nike": "Nike", "jordan": "Jordan", "new-balance": "New Balance",
  "on-cloud": "On Cloud", "asics": "Asics", "adidas": "Adidas",
  "hoka": "Hoka", "puma": "Puma", "louis-vuitton": "Louis Vuitton",
  "gucci": "Gucci", "onitsuka-tiger": "Onitsuka Tiger", "loro-piana": "Loro Piana",
  "brooks": "Brooks", "dior": "Dior", "hermes": "Hermes",
  "basketball": "Basketball Shoes", "running": "Running",
};

const Shop = () => {
  const [searchParams] = useSearchParams();
  const brandParam = searchParams.get("brand");
  const initialCategory = (brandParam && brandSlugToCategory[brandParam]) || "All";

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);
  const priceRange = priceRanges[selectedPriceRange];

  const { data: stockMap } = useProductStock();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const {
    data,
    isLoading,
    isFetching,
    page,
    setPage,
    resetPage,
    nextPage,
    prevPage,
    pageSize,
  } = usePaginatedProducts({
    search: debouncedSearch,
    category: selectedCategory,
    sortBy,
    priceMin: priceRange.min,
    priceMax: priceRange.max === Infinity ? undefined : priceRange.max,
  });

  useEffect(() => {
    const brand = searchParams.get("brand");
    setSelectedCategory((brand && brandSlugToCategory[brand]) || "All");
  }, [searchParams]);

  useEffect(() => { resetPage(); }, [debouncedSearch, selectedCategory, selectedPriceRange, sortBy, resetPage]);

  const products = data?.products || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = data?.hasMore || false;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleToggleWishlist = useCallback((id: string) => {
    if (isInWishlist(id)) {
      removeFromWishlist(id);
    } else {
      const product = products.find(p => p.id === id);
      if (product) {
        addToWishlist({
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          discountPercent: product.discountPercent,
          image: product.image,
          category: product.category,
          tagline: product.tagline,
          description: product.description,
          story: "",
          size: product.size,
          gallery: [product.image],
          notes: product.notes,
          ingredients: [],
          concentration: "",
          longevity: "",
          sillage: "",
          season: [],
          occasion: [],
        });
      }
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist, products]);

  const clearFilters = () => {
    setSearchInput("");
    setSelectedCategory("All");
    setSelectedPriceRange(0);
    setSortBy("featured");
  };

  const hasActiveFilters = searchInput || selectedCategory !== "All" || selectedPriceRange !== 0 || sortBy !== "featured";

  return (
    <>
      <Helmet>
        <title>Shop Premium Shoes Online | Desert Deal UAE</title>
        <meta name="description" content="Browse Desert Deal's exclusive shoe collection. Premium sneakers, casual shoes & formal footwear. Free shipping in UAE." />
        <link rel="canonical" href="https://desertsdeals.com/shop" />
      </Helmet>
      <CollectionPageSchema />

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10">
          <Navbar />

          {/* Breadcrumb */}
          <section className="pt-28 pb-2">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12">
              <nav className="text-sm text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                <span className="mx-2">›</span>
                <span className="text-foreground font-medium">All Shoes</span>
              </nav>
            </div>
          </section>

          {/* Filter & Sort Bar */}
          <section className="py-4">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12">

              {/* Mobile: compact filter row */}
              <div className="lg:hidden flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 h-10 text-sm bg-card border-border/50"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-auto min-w-[100px] h-10 text-xs bg-card border-border/50">
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-auto min-w-[90px] h-10 text-xs bg-card border-border/50">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop: reference-style filter bar */}
              <div className="hidden lg:flex items-center justify-between mb-6">
                {/* Left side: Filter toggle + result count */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-70 transition-opacity"
                  >
                    <Filter className="w-4 h-4" />
                    Filter Products
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Showing {products.length > 0 ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, totalCount)} of {totalCount} results
                    {isFetching && !isLoading && <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />}
                  </span>
                </div>

                {/* Right side: View toggle + Sort + Items */}
                <div className="flex items-center gap-4">
                  <div className="flex border border-border/50 rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode("grid")} className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-44 h-10 bg-card border-border/50 text-sm"><SelectValue placeholder="Sort by latest" /></SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={totalCount.toString()}>
                    <SelectTrigger className="w-32 h-10 bg-card border-border/50 text-sm">
                      <SelectValue placeholder={`${totalCount} Items`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={totalCount.toString()}>{totalCount} Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Expandable filter panel */}
              {showFilters && (
                <div className="hidden lg:flex flex-row gap-4 mb-6 p-4 bg-card rounded-lg border border-border/50">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search shoes..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-10 h-10 bg-background border-border/50"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40 h-10 bg-background border-border/50"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedPriceRange.toString()} onValueChange={(v) => setSelectedPriceRange(parseInt(v))}>
                    <SelectTrigger className="w-44 h-10 bg-background border-border/50"><SelectValue placeholder="Price Range" /></SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range, idx) => <SelectItem key={idx} value={idx.toString()}>{range.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="h-10">
                      <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              )}

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active:</span>
                  {searchInput && (
                    <span className="px-3 py-1 bg-card border border-border/50 rounded-full text-xs flex items-center gap-2">
                      "{searchInput}" <X className="w-3 h-3 cursor-pointer hover:text-primary" onClick={() => setSearchInput("")} />
                    </span>
                  )}
                  {selectedCategory !== "All" && (
                    <span className="px-3 py-1 bg-card border border-border/50 rounded-full text-xs flex items-center gap-2">
                      {selectedCategory} <X className="w-3 h-3 cursor-pointer hover:text-primary" onClick={() => setSelectedCategory("All")} />
                    </span>
                  )}
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* #11: Products Grid with slide-in animation, #5: 6 columns on desktop */}
              {!isLoading && products.length > 0 && (
                <div className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4"
                    : "flex flex-col gap-4"
                }>
                  {products.map((product) => (
                    <div key={product.id}>
                      <ProductCard
                        product={product}
                        soldOut={isProductSoldOut(stockMap, product.id)}
                        inWishlist={isInWishlist(product.id)}
                        onToggleWishlist={handleToggleWishlist}
                        viewMode={viewMode}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && products.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* All products shown - no pagination */}
            </div>
          </section>

          <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default memo(Shop);
