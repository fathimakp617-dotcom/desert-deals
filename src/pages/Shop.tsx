import { useState, useEffect, useCallback, memo, useRef, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Grid3X3, List, Filter, X, Loader2 } from "lucide-react";
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
import MobileBottomNav from "@/components/MobileBottomNav";
import PageTransition from "@/components/PageTransition";
import { CollectionPageSchema } from "@/components/seo/JsonLd";
import { useWishlist } from "@/contexts/WishlistContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import ProductCard from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";
import SearchSuggestions from "@/components/SearchSuggestions";
import MobileFilterSheet from "@/components/MobileFilterSheet";
import BackToTopButton from "@/components/BackToTopButton";
import { useCategories } from "@/hooks/useCategories";
import { useTranslation } from "@/contexts/DirectionContext";


const fallbackCategories = [
  "All", "Nike", "Jordan", "New Balance", "On Cloud", "Asics", "Adidas",
  "Hoka", "Puma", "Louis Vuitton", "Gucci", "Onitsuka Tiger", "Loro Piana",
  "Brooks", "Dior", "Hermes", "Basketball Shoes",
];
// Price ranges and sort options are built inside the component with t()

const brandSlugToCategory: Record<string, string> = {
  "nike": "Nike", "jordan": "Jordan", "new-balance": "New Balance",
  "on-cloud": "On Cloud", "asics": "Asics", "adidas": "Adidas",
  "hoka": "Hoka", "puma": "Puma", "louis-vuitton": "Louis Vuitton",
  "gucci": "Gucci", "onitsuka-tiger": "Onitsuka Tiger", "loro-piana": "Loro Piana",
  "brooks": "Brooks", "dior": "Dior", "hermes": "Hermes",
  "basketball": "Basketball Shoes", "running": "Running",
  "watches": "Watches", "wallets": "Wallets", "sunglasses": "Sunglasses",
  "heels": "Heels", "rolex": "Rolex", "cartier": "Cartier",
  "tom-ford": "Tom Ford", "christian-louboutin": "Christian Louboutin",
  "chanel": "Chanel", "goyard": "Goyard", "socks": "Socks", "jersey": "Jersey",
  "bags": "Bags", "kids": "Kids",
};

const Shop = () => {
  const { t } = useTranslation();

  const priceRanges = useMemo(() => [
    { label: t("shop.allPrices"), min: 0, max: Infinity },
    { label: t("shop.under200"), min: 0, max: 200 },
    { label: t("shop.200to350"), min: 200, max: 350 },
    { label: t("shop.350to500"), min: 350, max: 500 },
    { label: t("shop.above500"), min: 500, max: Infinity },
  ], [t]);

  const sortOptions = useMemo(() => [
    { label: t("shop.relevance"), value: "featured" },
    { label: t("shop.sortByPopularity"), value: "name-asc" },
    { label: t("shop.sortByRating"), value: "rating" },
    { label: t("shop.sortByLatest"), value: "latest" },
    { label: t("shop.sortByPriceLow"), value: "price-asc" },
    { label: t("shop.sortByPriceHigh"), value: "price-desc" },
  ], [t]);

  const [searchParams] = useSearchParams();
  const brandParam = searchParams.get("brand");
  const searchParam = searchParams.get("search");
  const initialCategory = (brandParam && brandSlugToCategory[brandParam]) || "All";

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { data: dbCategories } = useCategories();
  const categories = dbCategories?.length
    ? ["All", ...dbCategories.map(c => c.label)]
    : fallbackCategories;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isFetching,
  } = useInfiniteProducts({
    search: debouncedSearch,
    category: selectedCategory,
    sortBy,
    priceMin: priceRange.min,
    priceMax: priceRange.max === Infinity ? undefined : priceRange.max,
  });

  useEffect(() => {
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");
    setSelectedCategory((brand && brandSlugToCategory[brand]) || "All");
    setSearchInput(search || "");
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lazy-load next pages only when the user gets near the bottom for smoother UX
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  const products = useMemo(
    () => data?.pages.flatMap(p => p.products) || [],
    [data]
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;

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
          construction: { upper: [], midsole: [], outsole: [] },
          materials: [],
          style: "",
          comfort: "",
          fit: "",
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
        <main className="min-h-screen bg-background relative z-10 pb-16 md:pb-0">
          <Navbar />

          <section className="pt-40 lg:pt-44 pb-2">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12">
              {/* Breadcrumb */}
              <nav className="text-sm text-muted-foreground mb-6">
                <Link to="/" className="hover:text-foreground transition-colors">{t("common.home")}</Link>
                <span className="mx-2">›</span>
                <Link to="/shop" className="hover:text-foreground transition-colors">{t("common.shop")}</Link>
                {selectedCategory !== "All" && (
                  <>
                    <span className="mx-2">›</span>
                    <span className="text-foreground font-medium">{selectedCategory}</span>
                  </>
                )}
                {debouncedSearch && (
                  <>
                    <span className="mx-2">›</span>
                    <span className="text-foreground font-medium">{t("shop.searchResults")} "{debouncedSearch}"</span>
                  </>
                )}
              </nav>

              {/* Filter + Sort row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setMobileFilterOpen(true);
                      } else {
                        setShowFilters(!showFilters);
                      }
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-70 transition-opacity"
                  >
                    <Filter className="w-4 h-4" />
                    {t("shop.filter")}
                  </button>

                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {totalCount} items
                    {isFetching && !isLoading && <Loader2 className="inline-block ms-1 h-3 w-3 animate-spin" />}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground hidden sm:inline">Sort:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] h-10 bg-card border-border/50 rounded-full text-sm">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {sortOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <div className="hidden lg:flex border border-border/50 rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Filter & Sort Bar */}
          <section className="py-4">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12">

              {/* Expandable filter panel */}
              {showFilters && (
                <div className="hidden lg:flex flex-row gap-4 mb-6 p-4 bg-card rounded-lg border border-border/50">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search shoes..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="ps-10 h-10 bg-background border-border/50"
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
                      <X className="w-3 h-3 me-1" /> Clear
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

              {/* Products Grid */}
              {!isLoading && products.length > 0 && (
                <div className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1.5 sm:gap-2"
                    : "flex flex-col gap-4"
                }>
                  {products.map((product) => (
                    <div key={product.id} className="h-full">
                      <ProductCard
                        product={product}
                        soldOut={product.stockQuantity === 0}
                        inWishlist={isInWishlist(product.id)}
                        onToggleWishlist={handleToggleWishlist}
                        onQuickView={setQuickViewId}
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

              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="h-1" />

              {(hasNextPage || isFetchingNextPage) && products.length > 0 && (
                <p className="text-center text-xs text-muted-foreground mb-2 mt-4">
                  Loading products… {products.length} loaded
                </p>
              )}

              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                </div>
              )}

              {!isLoading && totalCount > 0 && (
                <p className="text-center text-xs text-muted-foreground mb-4 mt-2">
                  Showing {Math.min(products.length, totalCount)} of {totalCount} products
                </p>
              )}

              {!isLoading && totalCount === 0 && products.length > 0 && !hasNextPage && (
                <p className="text-center text-xs text-muted-foreground mb-4 mt-2">
                  Showing {products.length} products
                </p>
              )}
            </div>
          </section>


          <MobileFilterSheet
            open={mobileFilterOpen}
            onOpenChange={setMobileFilterOpen}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortOptions={sortOptions}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onClear={clearFilters}
            hasActiveFilters={!!hasActiveFilters}
          />

          <BackToTopButton />
          <Footer />
          <MobileBottomNav />
        </main>

        <QuickViewDialog
          productId={quickViewId}
          open={!!quickViewId}
          onOpenChange={(open) => { if (!open) setQuickViewId(null); }}
        />
      </PageTransition>
    </>
  );
};

export default memo(Shop);
