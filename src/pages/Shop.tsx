import { useState, useEffect, useCallback, memo } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { Search, Grid3X3, List, Filter, X, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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

  // Sync category from URL brand param
  useEffect(() => {
    const brand = searchParams.get("brand");
    setSelectedCategory((brand && brandSlugToCategory[brand]) || "All");
  }, [searchParams]);

  // Reset to page 0 when filters change
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

          {/* Hero Banner - minimal, no heavy animation */}
          <section className="pt-28 pb-12 bg-gradient-to-b from-charcoal to-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12 text-center">
              <p className="text-sm tracking-[0.4em] text-primary mb-3">EXPLORE</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading tracking-tight mb-4">
                Our <span className="text-gold-gradient">Collection</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                Discover our premium range of shoes and accessories.
              </p>
            </div>
          </section>

          {/* Filters & Products */}
          <section className="py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12">
              {/* Search & Filter Bar */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search shoes..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-12 h-12 bg-card border-border/50 focus:border-primary"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-border/50 hover:border-primary"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </Button>

                {/* Desktop Filters */}
                <div className="hidden lg:flex items-center gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40 h-12 bg-card border-border/50"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={selectedPriceRange.toString()} onValueChange={(v) => setSelectedPriceRange(parseInt(v))}>
                    <SelectTrigger className="w-48 h-12 bg-card border-border/50"><SelectValue placeholder="Price Range" /></SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range, idx) => <SelectItem key={idx} value={idx.toString()}>{range.label}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44 h-12 bg-card border-border/50"><SelectValue placeholder="Sort by" /></SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <div className="flex border border-border/50 rounded-md overflow-hidden">
                    <button onClick={() => setViewMode("grid")} className={`p-3 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-3 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Filters */}
              {showFilters && (
                <div className="lg:hidden mb-6 space-y-3">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full h-12 bg-card border-border/50"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedPriceRange.toString()} onValueChange={(v) => setSelectedPriceRange(parseInt(v))}>
                    <SelectTrigger className="w-full h-12 bg-card border-border/50"><SelectValue placeholder="Price Range" /></SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range, idx) => <SelectItem key={idx} value={idx.toString()}>{range.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full h-12 bg-card border-border/50"><SelectValue placeholder="Sort by" /></SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchInput && (
                    <span className="px-3 py-1 bg-card border border-border/50 rounded-full text-sm flex items-center gap-2">
                      "{searchInput}" <X className="w-3 h-3 cursor-pointer hover:text-primary" onClick={() => setSearchInput("")} />
                    </span>
                  )}
                  {selectedCategory !== "All" && (
                    <span className="px-3 py-1 bg-card border border-border/50 rounded-full text-sm flex items-center gap-2">
                      {selectedCategory} <X className="w-3 h-3 cursor-pointer hover:text-primary" onClick={() => setSelectedCategory("All")} />
                    </span>
                  )}
                  <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear all</button>
                </div>
              )}

              {/* Results Count + Pagination Info */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {products.length > 0 ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, totalCount)} of {totalCount} products
                  {isFetching && !isLoading && <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />}
                </p>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Products Grid - NO framer-motion animations for speed */}
              {!isLoading && products.length > 0 && (
                <div className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
                    : "flex flex-col gap-4"
                }>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      soldOut={isProductSoldOut(stockMap, product.id)}
                      inWishlist={isInWishlist(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                      viewMode={viewMode}
                    />
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={page === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      // Show smart page numbers
                      let pageNum: number;
                      if (totalPages <= 7) {
                        pageNum = i;
                      } else if (page < 4) {
                        pageNum = i;
                      } else if (page > totalPages - 5) {
                        pageNum = totalPages - 7 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                            pageNum === page
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={!hasMore}
                    className="gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </section>

          <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default memo(Shop);
