import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw, Star, ShoppingBag, PenLine, Zap, AlertCircle, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductReviews from "@/components/ProductReviews";
import RelatedProducts from "@/components/RelatedProducts";

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
import { useProductSoldCount } from "@/hooks/useProductSoldCount";


import BuyNowOverlay from "@/components/BuyNowOverlay";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useDbProduct(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const touchStartX = useRef(0);

  // Auto-slide images every 10 seconds
  useEffect(() => {
    if (!product || product.gallery.length <= 1) return;
    const timer = setInterval(() => {
      setSelectedImage((p) => (p + 1) % product.gallery.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [product]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showDescription, setShowDescription] = useState(true);
  const [showSpecification, setShowSpecification] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showBuyNow, setShowBuyNow] = useState(false);
  const { addToCart, buyNow } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { data: stockMap } = useProductStock();
  
  const isSoldOut = isProductSoldOut(stockMap, id || "");
  const stockQuantity = getProductStock(stockMap, id || "");
  const { data: soldCount = 0 } = useProductSoldCount(id);

  // Track Meta Pixel ViewContent once per product
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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

  const handleAddToCart = () => {
    if (isSoldOut) {
      toast.error("This product is currently sold out");
      return;
    }
    if (!selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    addToCart(product, quantity, `EU ${selectedSize}`);
    trackAddToCart({
      content_ids: [product.id],
      value: product.price * quantity,
      currency: "AED",
    });
    toast.success(`${product.name} added to cart`, {
      description: `Size: EU ${selectedSize} · Quantity: ${quantity}`,
    });
  };



  const handleBuyNow = () => {
    if (isSoldOut) {
      toast.error("This product is currently sold out");
      return;
    }
    if (!selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    buyNow(product, quantity, `EU ${selectedSize}`);
    setShowBuyNow(true);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    toast.success(
      inWishlist ? `${product.name} removed from wishlist` : `${product.name} added to wishlist`
    );
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
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
                {/* Main Image with swipe & auto-slide */}
                <div
                  className="relative w-full aspect-square overflow-hidden bg-card/50 touch-pan-y"
                  onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={(e) => {
                    const diff = touchStartX.current - e.changedTouches[0].clientX;
                    if (Math.abs(diff) > 50 && product.gallery.length > 1) {
                      if (diff > 0) setSelectedImage((p) => (p + 1) % product.gallery.length);
                      else setSelectedImage((p) => (p - 1 + product.gallery.length) % product.gallery.length);
                    }
                  }}
                >
                  
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
                        onClick={() => setSelectedImage((p) => (p - 1 + product.gallery.length) % product.gallery.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedImage((p) => (p + 1) % product.gallery.length)}
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
                          onClick={() => setSelectedImage(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            selectedImage === idx ? "bg-foreground w-4" : "bg-foreground/40"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      src={product.gallery[selectedImage] || product.image}
                      alt={product.name}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  </AnimatePresence>
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
                        onClick={() => setSelectedImage(idx)}
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
                  </div>
                {!isSoldOut ? (
                    <span className="text-xs sm:text-sm font-medium text-green-600">IN STOCK</span>
                  ) : (
                    <span className="text-xs sm:text-sm font-medium text-destructive">Sold Out</span>
                  )}
                </motion.div>

                {/* Sold count badge */}
                {soldCount > 0 && (
                  <motion.div variants={staggerItem} className="flex items-center gap-1.5">
                    <span className="text-lg">🔥</span>
                    <span className="text-sm font-semibold text-orange-600">
                      Sold Out {soldCount} {soldCount === 1 ? "Time" : "Times"}
                    </span>
                  </motion.div>
                )}

                {/* Rating stars - matching review section style */}
                {totalReviews > 0 && (
                  <motion.div variants={staggerItem} className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${s <= Math.floor(averageRating) ? "fill-primary text-primary" : s <= averageRating ? "fill-primary/50 text-primary/50" : "text-muted-foreground/30"} transition-colors`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </motion.div>
                )}

                {/* Size Selector */}
                <motion.div variants={staggerItem} className="space-y-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">Size <span className="text-destructive">*</span></p>
                  <div className="flex flex-wrap gap-1.5">
                    {(product.size
                      ? product.size.split(",").map(s => s.trim().replace(/^EU\s*/i, "")).filter(Boolean).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b)
                      : [36, 37, 38, 39, 40, 41, 42, 43, 44, 45]
                    ).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border text-xs sm:text-sm font-medium transition-all duration-200 ${
                          selectedSize === size
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </motion.div>

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

                {/* Description - always visible */}
                <motion.div variants={staggerItem} className="space-y-4 pt-4 border-b border-border/50 pb-6">
                  <h3 className="text-base font-heading font-semibold text-foreground">Description</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
                    {product.story || product.description}
                  </p>
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

        {/* Related Products */}
        <RelatedProducts currentProductId={product.id} currentCategory={product.category} />

        <Footer />
        <MobileBottomNav />
        </main>
      </PageTransition>
      <BuyNowOverlay isOpen={showBuyNow} onClose={() => setShowBuyNow(false)} />
    </>
  );
};

export default memo(ProductDetail);
