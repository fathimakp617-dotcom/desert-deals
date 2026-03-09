import { useState, useEffect, useCallback, useRef, memo } from "react";
import ImageZoom from "@/components/ImageZoom";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw, Star, ShoppingBag, PenLine, Zap, AlertCircle, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductReviews from "@/components/ProductReviews";
import RelatedProducts from "@/components/RelatedProducts";
import FrequentlyBoughtTogether from "@/components/FrequentlyBoughtTogether";
import BrandProductRow from "@/components/BrandProductRow";
import RecentlyViewedProducts, { addToRecentlyViewed } from "@/components/RecentlyViewedProducts";
import CustomersAlsoBought from "@/components/CustomersAlsoBought";

import PageTransition from "@/components/PageTransition";
import { formatPrice } from "@/data/products";
import { useDbProduct } from "@/hooks/useDbProducts";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useProductStock, isProductSoldOut, getProductStock } from "@/hooks/useProductStock";
import { fadeInUp, fadeInLeft, staggerContainer, staggerItem } from "@/lib/animations";
import { toast } from "sonner";
import { trackViewContent, trackAddToCart } from "@/lib/metaPixel";

import { supabase } from "@/integrations/supabase/client";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";



import BuyNowOverlay from "@/components/BuyNowOverlay";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useDbProduct(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false, skipSnaps: false });

  const onEmblaSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedImage(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onEmblaSelect);
    return () => { emblaApi.off("select", onEmblaSelect); };
  }, [emblaApi, onEmblaSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Reset size & quantity when navigating to a different product
  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
    setSelectedImage(0);
    if (emblaApi) emblaApi.scrollTo(0, true);
  }, [id]);

  // Auto-slide images every 10 seconds
  useEffect(() => {
    if (!product || product.gallery.length <= 1 || !emblaApi) return;
    const timer = setInterval(() => {
      emblaApi.scrollNext();
    }, 10000);
    return () => clearInterval(timer);
  }, [product, emblaApi]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [showSpecification, setShowSpecification] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showBuyNow, setShowBuyNow] = useState(false);
  const { addToCart, buyNow } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { data: stockMap } = useProductStock();
  
  const isSoldOut = isProductSoldOut(stockMap, id || "");
  const stockQuantity = getProductStock(stockMap, id || "");
  

  // Track Meta Pixel ViewContent + recently viewed
  const viewContentFired = useRef(false);
  useEffect(() => {
    if (product && !viewContentFired.current) {
      viewContentFired.current = true;
      trackViewContent({
        content_ids: [product.id],
        content_name: product.name,
        value: product.price,
        currency: "AED",
      });
      addToRecentlyViewed(product);
    }
  }, [product]);

  useEffect(() => {
    if (id) {
      fetchRatingSummary();
    }
  }, [id]);

  const fetchRatingSummary = async () => {
    try {
      const { data, error } = await supabase.rpc("get_product_rating", {
        p_product_id: id || "",
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setAverageRating(Number(data[0].average_rating) || 0);
        setTotalReviews(Number(data[0].total_reviews) || 0);
      }
    } catch (error) {
      console.error("Error fetching rating summary:", error);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <section className="pt-24 sm:pt-28">
          <div className="mx-auto px-0 lg:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="space-y-4 p-4 sm:p-6 lg:p-8">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full bg-muted animate-pulse rounded mt-6" />
                <div className="h-10 w-full bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading mb-4">Product Not Found</h1>
          <Link to="/shop" className="text-primary hover:underline">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const categoryLower = (product.category || "").toLowerCase();
  const needsSize = !["bags", "bag"].some(c => categoryLower.includes(c));

  const handleAddToCart = () => {
    if (isSoldOut) {
      toast.error("This product is currently sold out");
      return;
    }
    if (needsSize && !selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    const sizeLabel = needsSize && selectedSize ? selectedSize : "One Size";
    addToCart(product, quantity, sizeLabel);
    trackAddToCart({
      content_ids: [product.id],
      value: product.price * quantity,
      currency: "AED",
    });
    setShowBuyNow(true);
  };


  const handleBuyNow = () => {
    if (isSoldOut) {
      toast.error("This product is currently sold out");
      return;
    }
    if (needsSize && !selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    const sizeLabel = needsSize && selectedSize ? `EU ${selectedSize}` : "One Size";
    buyNow(product, quantity, sizeLabel);
    setShowBuyNow(true);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    toast.success(
      inWishlist ? `${product.name} removed from wishlist` : `${product.name} added to wishlist`
    );
  };

  const handleShare = async () => {
    const shareUrl = `https://desertsdeals.com/product/${product.id}`;
    const shareText = `✨ Check out ${product.name} from Desert Deal!\n\n${product.tagline}\n\n💰 Price: ${formatPrice(product.price)}\n\n🔗 `;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | Desert Deal`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(`${shareText}${shareUrl}`);
          toast.success("Link copied to clipboard");
        }
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}${shareUrl}`);
      toast.success("Link copied to clipboard", {
        description: "Share this with your friends!",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>{product.name} - Buy Online | Desert Deal UAE</title>
        <meta name="description" content={`${product.name}: ${product.tagline}. ${product.description.slice(0, 120)}... Buy online with free shipping in UAE.`} />
        <meta name="keywords" content={`${product.name}, premium shoes, buy online UAE`} />
        
        <link rel="canonical" href={`https://desertsdeals.com/product/${product.id}`} />
        
        <meta property="og:title" content={`${product.name} - ${product.tagline} | Desert Deal`} />
        <meta property="og:description" content={`${product.description.slice(0, 150)}... Shop now!`} />
        <meta property="og:type" content="og:product" />
        <meta property="og:url" content={`https://desertsdeals.com/product/${product.id}`} />
        <meta property="og:image" content={product.image.startsWith('http') ? product.image : `https://desertsdeals.com${product.image}`} />
        <meta property="og:site_name" content="Desert Deal" />
        <meta property="og:locale" content="en_AE" />
        
        <meta property="product:brand" content={product.category || "Desert Deal"} />
        <meta property="product:availability" content={isSoldOut ? "out of stock" : "in stock"} />
        <meta property="product:condition" content="new" />
        <meta property="product:price:amount" content={product.price.toString()} />
        <meta property="product:price:currency" content="AED" />
        <meta property="product:retailer_item_id" content={product.id} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} - ${product.tagline} | Desert Deal`} />
        <meta name="twitter:description" content={`${product.description.slice(0, 150)}...`} />
        <meta name="twitter:image" content={product.image.startsWith('http') ? product.image : `https://desertsdeals.com${product.image}`} />
      </Helmet>
      
      <ProductSchema product={product} averageRating={averageRating} totalReviews={totalReviews} />
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        { name: product.name, url: `/product/${product.id}` },
      ]} />

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10 pb-20 md:pb-0 overflow-x-hidden">
          <Navbar />

        {/* Breadcrumb */}
        <section className="pt-20 pb-2 sm:pt-24 sm:pb-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm tracking-wider">BACK</span>
            </motion.button>
          </div>
        </section>

        {/* Product Hero */}
        <section className="py-4 sm:py-8 lg:py-12">
          <div className="mx-auto px-0 lg:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Image Gallery */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInLeft}
                className="space-y-3"
              >
                {/* Main Image Carousel (Embla) */}
                <div className="relative w-full aspect-square overflow-hidden bg-card/50">
                  {isSoldOut && (
                    <div className="absolute top-6 right-6 z-20">
                      <Badge variant="destructive" className="text-xs sm:text-sm font-semibold px-3 py-1.5">
                        SOLD OUT
                      </Badge>
                    </div>
                  )}

                  {/* Navigation arrows */}
                  {product.gallery.length > 1 && (
                    <>
                      <button
                        onClick={scrollPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={scrollNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Dot indicators */}
                  {product.gallery.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                      {product.gallery.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => emblaApi?.scrollTo(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            selectedImage === idx ? "bg-foreground w-4" : "bg-foreground/40"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="overflow-hidden h-full" ref={emblaRef}>
                    <div className="flex h-full">
                      {product.gallery.map((img, idx) => (
                        <div key={idx} className="flex-[0_0_100%] min-w-0 h-full">
                          <ImageZoom
                            src={img || product.image}
                            alt={product.name}
                            className="w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Thumbnails */}
                {product.gallery.length > 1 && (
                <div className="relative group/thumbs px-2 lg:px-0">
                  {product.gallery.length > 4 && (
                    <>
                      <button
                        onClick={() => {
                          const el = document.getElementById('thumb-strip');
                          if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
                        }}
                        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/90 border border-border rounded-full flex items-center justify-center text-foreground shadow-sm hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const el = document.getElementById('thumb-strip');
                          if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
                        }}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/90 border border-border rounded-full flex items-center justify-center text-foreground shadow-sm hover:bg-background transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <div id="thumb-strip" className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 scroll-smooth">
                    {product.gallery.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => { emblaApi?.scrollTo(idx); setSelectedImage(idx); }}
                        className={`flex-shrink-0 w-[calc(25%-6px)] lg:w-[calc(16.666%-8px)] aspect-square border-2 overflow-hidden transition-all snap-start rounded-sm ${
                          selectedImage === idx ? "border-primary" : "border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                )}
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-4 sm:space-y-5 min-w-0 px-4 sm:px-6 lg:px-8 lg:pr-12"
              >

                {/* Product Name */}
                <div>
                  <motion.h1 variants={staggerItem} className="text-xl sm:text-2xl lg:text-4xl font-medium tracking-tight break-words">
                    {product.name}
                  </motion.h1>
                </div>

                {/* Price & Stock */}
                <motion.div variants={staggerItem} className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-baseline gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-light tracking-tight text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-light text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    {product.discountPercent > 0 && (
                      <span className="text-lg sm:text-xl font-bold text-green-600">-{product.discountPercent}%</span>
                    )}
                  </div>
                {!isSoldOut ? (
                    <span className="text-xs sm:text-sm font-medium text-green-600">IN STOCK</span>
                  ) : (
                    <span className="text-xs sm:text-sm font-medium text-destructive">Sold Out</span>
                  )}
                </motion.div>


                {/* Rating stars - matching review section style */}
                {totalReviews > 0 && (
                  <motion.div
                    variants={staggerItem}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setShowReviews(true);
                      setTimeout(() => {
                        document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                         <Star
                          key={s}
                          className={`w-5 h-5 ${s <= Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : s <= averageRating ? "fill-yellow-400/50 text-yellow-400/50" : "text-muted-foreground/30"} transition-colors`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground underline underline-offset-2">
                      {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </motion.div>
                )}

                {/* Size Selector */}
                {needsSize && (
                <motion.div variants={staggerItem} className="space-y-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">Size <span className="text-destructive">*</span></p>
                  <div className="flex flex-wrap gap-1.5">
                    {([...new Set(product.size
                      ? product.size.split(",").map(s => s.trim()).filter(Boolean)
                      : ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
                    )]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-9 h-9 px-2 sm:min-w-11 sm:h-11 rounded-full border text-xs sm:text-sm font-medium transition-all duration-200 ${
                          selectedSize === size
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground text-foreground"
                        }`}
                      >
                        {size.replace(/^EU\s*/i, "")}
                      </button>
                    ))}
                  </div>
                </motion.div>
                )}

                {/* Stock warnings */}
                {isSoldOut && (
                  <motion.div variants={staggerItem} className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <span className="text-destructive font-medium text-sm">This product is currently sold out</span>
                  </motion.div>
                )}
                
                {!isSoldOut && stockQuantity > 0 && stockQuantity <= 10 && (
                  <motion.div variants={staggerItem} className="flex items-center gap-2 p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="text-orange-500 text-xs sm:text-sm">Only {stockQuantity} left in stock!</span>
                  </motion.div>
                )}

                {/* Quantity + Add to Cart */}
                <motion.div variants={staggerItem} className="flex gap-2 sm:gap-3">
                  <div className="flex items-center border border-border rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2 sm:px-3 py-2 sm:py-3 text-foreground hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium min-w-[32px] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-2 sm:px-3 py-2 sm:py-3 text-foreground hover:bg-muted transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isSoldOut}
                    className="flex-1 bg-foreground hover:bg-foreground/90 text-background py-5 sm:py-6 text-xs sm:text-sm tracking-widest font-medium transition-all duration-300 rounded-full"
                  >
                    {isSoldOut ? "SOLD OUT" : "Add to cart"}
                  </Button>
                </motion.div>

                {/* Buy Now + Wishlist */}
                <motion.div variants={staggerItem} className="flex gap-2 sm:gap-3">
                  <Button
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={isSoldOut}
                    variant="outline"
                    className="flex-1 py-5 sm:py-6 text-xs sm:text-sm tracking-widest font-medium border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 rounded-full"
                  >
                    Buy Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleToggleWishlist}
                    className={`px-4 sm:px-5 py-5 sm:py-6 border-border hover:border-foreground ${inWishlist ? "bg-primary/10 border-primary" : ""}`}
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${inWishlist ? "fill-primary text-primary" : ""}`} />
                  </Button>
                </motion.div>

                {/* Delivery Estimate */}
                <motion.div variants={staggerItem} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <Truck className="w-5 h-5 text-primary shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      Estimated Delivery: {(() => {
                        const now = new Date();
                        const addBusinessDays = (start: Date, days: number) => {
                          const result = new Date(start);
                          let added = 0;
                          while (added < days) {
                            result.setDate(result.getDate() + 1);
                            if (result.getDay() !== 0) added++; // Skip Sunday
                          }
                          return result;
                        };
                        const from = addBusinessDays(now, 1);
                        const to = addBusinessDays(now, 2);
                        const fmt = (d: Date) => d.toLocaleDateString("en-AE", { weekday: "short", month: "short", day: "numeric" });
                        return `${fmt(from)} – ${fmt(to)}`;
                      })()}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">Order now • No delivery on Sundays</p>
                  </div>
                </motion.div>

                {/* Social Share Bar */}
                <motion.div variants={staggerItem} className="flex items-center gap-4 py-2">
                  <span className="text-sm font-medium text-foreground">Share:</span>
                  <div className="flex items-center gap-3">
                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://desertsdeals.com/product/${product.id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                      aria-label="Share on Facebook"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    {/* X / Twitter */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`✨ Check out ${product.name} - ${formatPrice(product.price)} at Desert Deal!`)}&url=${encodeURIComponent(`https://desertsdeals.com/product/${product.id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                      aria-label="Share on X"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    {/* Pinterest */}
                    <a
                      href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(`https://desertsdeals.com/product/${product.id}`)}&media=${encodeURIComponent(product.image.startsWith('http') ? product.image : `https://desertsdeals.com${product.image}`)}&description=${encodeURIComponent(product.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                      aria-label="Share on Pinterest"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
                    </a>
                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`✨ ${product.name}\n💰 ${formatPrice(product.price)}\n🔗 https://desertsdeals.com/product/${product.id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                      aria-label="Share on WhatsApp"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(`https://desertsdeals.com/product/${product.id}`)}&text=${encodeURIComponent(`✨ ${product.name} - ${formatPrice(product.price)}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                      aria-label="Share on Telegram"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </a>
                  </div>
                </motion.div>

                {/* Description - collapsible */}
                <motion.div variants={staggerItem} className="space-y-3 border-b border-border/50 pb-4">
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="text-base font-heading font-semibold text-foreground flex items-center justify-between w-full"
                  >
                    Description
                    <span className="text-muted-foreground text-sm">{showDescription ? "−" : "+"}</span>
                  </button>
                  {showDescription && (
                    <div className="pt-2">
                      {(() => {
                        const desc = product.story || product.description || "";
                        const isHtml = /<[a-z][\s\S]*>/i.test(desc);
                        return isHtml ? (
                          <div
                            className="text-muted-foreground leading-relaxed text-xs prose prose-xs max-w-none [&_img]:rounded-lg [&_img]:w-[160px] [&_img]:h-auto [&_img]:inline-block [&_img]:m-1 [&_p]:text-xs [&_p]:mb-2 [&_span]:text-xs"
                            dangerouslySetInnerHTML={{ __html: desc }}
                          />
                        ) : (
                          <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">{desc}</p>
                        );
                      })()}
                    </div>
                  )}
                </motion.div>

                {/* Additional Information - collapsible text link */}
                <motion.div variants={staggerItem} className="space-y-3 border-b border-border/50 pb-4">
                  <button
                    onClick={() => setShowAdditional(!showAdditional)}
                    className="text-base font-heading text-primary hover:underline"
                  >
                    Additional information
                  </button>
                  {showAdditional && (
                    <div className="pt-2 space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-border/20">
                        <span className="text-muted-foreground">Category</span>
                        <span className="text-foreground">{product.category}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/20">
                        <span className="text-muted-foreground">Available Sizes</span>
                        <span className="text-foreground">EU 36 – 45</span>
                      </div>
                      {product.occasion.length > 0 && (
                        <div className="flex justify-between py-2 border-b border-border/20">
                          <span className="text-muted-foreground">Best For</span>
                          <span className="text-foreground">{product.occasion.join(", ")}</span>
                        </div>
                      )}
                      {product.materials.length > 0 && (
                        <div className="flex justify-between py-2 border-b border-border/20">
                          <span className="text-muted-foreground">Materials</span>
                          <span className="text-foreground">{product.materials.join(", ")}</span>
                        </div>
                      )}
                      {product.comfort && (
                        <div className="flex justify-between py-2 border-b border-border/20">
                          <span className="text-muted-foreground">Comfort</span>
                          <span className="text-foreground">{product.comfort}</span>
                        </div>
                      )}
                      {product.fit && (
                        <div className="flex justify-between py-2 border-b border-border/20">
                          <span className="text-muted-foreground">Fit</span>
                          <span className="text-foreground">{product.fit}</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Reviews - collapsible text link */}
                <motion.div variants={staggerItem} className="space-y-3" id="reviews-section">
                  <button
                    onClick={() => setShowReviews(!showReviews)}
                    className="text-base font-heading text-primary hover:underline"
                  >
                    Reviews
                  </button>
                  {showReviews && (
                    <div className="pt-2">
                      <ProductReviews productId={product.id} />
                    </div>
                  )}
                </motion.div>

              </motion.div>
            </div>
          </div>
        </section>

        {/* Cross-sell sections */}
        <div className="border-t border-border mt-4">
          <RelatedProducts currentProductId={product.id} currentCategory={product.category} />
          <CustomersAlsoBought currentProduct={product} />
          <RecentlyViewedProducts currentProductId={product.id} />
          <BrandProductRow brand="Nike" title="Nike" />
          <BrandProductRow brand="Adidas" title="Adidas" />
          <BrandProductRow brand="New Balance" title="New Balance" />
          <BrandProductRow brand="On Cloud" title="On Cloud" />
          <BrandProductRow brand="Asics" title="Asics" />
          <BrandProductRow brand="Onitsuka Tiger" title="Onitsuka Tiger" />
          <BrandProductRow brand="Loro Piana" title="Loro Piana" />
          <BrandProductRow brand="" title="All Products" shopLink="/shop" />
        </div>

        <Footer />
        <MobileBottomNav />
        </main>
      </PageTransition>
      <BuyNowOverlay isOpen={showBuyNow} onClose={() => setShowBuyNow(false)} />
    </>
  );
};

export default memo(ProductDetail);
