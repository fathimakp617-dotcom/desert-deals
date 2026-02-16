import { useState, useEffect, memo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw, Star, ShoppingBag, PenLine, Zap, AlertCircle, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

import { supabase } from "@/integrations/supabase/client";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";


const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useDbProduct(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const { addToCart, buyNow } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { data: stockMap } = useProductStock();
  
  const isSoldOut = isProductSoldOut(stockMap, id || "");
  const stockQuantity = getProductStock(stockMap, id || "");

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
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart`, {
      description: `Quantity: ${quantity}`,
    });
  };

  const handleBuyNow = () => {
    if (isSoldOut) {
      toast.error("This product is currently sold out");
      return;
    }
    buyNow(product, quantity);
    navigate("/checkout");
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
        
        <link rel="canonical" href={`${window.location.origin}/product/${product.id}`} />
        
        <meta property="og:title" content={`${product.name} - ${product.tagline} | Desert Deal`} />
        <meta property="og:description" content={`${product.description.slice(0, 150)}... Shop now!`} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`${window.location.origin}/product/${product.id}`} />
        <meta property="og:image" content={`${window.location.origin}${product.image}`} />
        <meta property="og:site_name" content="Desert Deal" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} - ${product.tagline} | Desert Deal`} />
        <meta name="twitter:description" content={`${product.description.slice(0, 150)}...`} />
        <meta name="twitter:image" content={`${window.location.origin}${product.image}`} />
        
        <meta property="product:price:amount" content={product.price.toString()} />
        <meta property="product:price:currency" content="AED" />
      </Helmet>
      
      <ProductSchema product={product} averageRating={averageRating} totalReviews={totalReviews} />
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        { name: product.name, url: `/product/${product.id}` },
      ]} />

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10">
          <Navbar />

        {/* Breadcrumb */}
        <section className="pt-24 pb-4">
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
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Image Gallery */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInLeft}
                className="space-y-4"
              >
                {/* Main Image */}
                <div className="relative aspect-square overflow-hidden border border-border/50 bg-card/50">
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/60 z-10" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/60 z-10" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/60 z-10" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/60 z-10" />
                  
                  {isSoldOut && (
                    <div className="absolute top-8 right-8 z-20">
                      <Badge variant="destructive" className="text-sm font-semibold px-4 py-2">
                        SOLD OUT
                      </Badge>
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
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>
                </div>

                {/* Thumbnails */}
                {product.gallery.length > 1 && (
                <div className="flex gap-4">
                  {product.gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 sm:w-24 sm:h-24 border-2 overflow-hidden transition-all ${
                        selectedImage === idx ? "border-primary" : "border-border/50 hover:border-primary/50"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                )}
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-6"
              >
                {/* Product Name */}
                <div>
                  <motion.h1 variants={staggerItem} className="text-2xl sm:text-3xl md:text-4xl font-heading tracking-tight">
                    {product.name}
                  </motion.h1>
                </div>

                {/* Price & Stock */}
                <motion.div variants={staggerItem} className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-heading text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  </div>
                  {!isSoldOut ? (
                    <span className="text-sm font-medium text-green-600">In Stock</span>
                  ) : (
                    <span className="text-sm font-medium text-destructive">Sold Out</span>
                  )}
                </motion.div>

                {/* Size Selector */}
                <motion.div variants={staggerItem} className="space-y-3">
                  <p className="text-sm text-muted-foreground">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {[36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 border text-sm font-medium transition-all duration-200 rounded-md ${
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
                  <motion.div variants={staggerItem} className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <span className="text-destructive font-medium">This product is currently sold out</span>
                  </motion.div>
                )}
                
                {!isSoldOut && stockQuantity > 0 && stockQuantity <= 10 && (
                  <motion.div variants={staggerItem} className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-500 text-sm">Only {stockQuantity} left in stock!</span>
                  </motion.div>
                )}

                {/* Quantity + Add to Cart */}
                <motion.div variants={staggerItem} className="flex gap-3">
                  <div className="flex items-center border border-border rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-3 text-foreground hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-3 text-sm font-medium min-w-[40px] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-3 text-foreground hover:bg-muted transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isSoldOut}
                    className="flex-1 bg-foreground hover:bg-foreground/90 text-background py-6 text-sm tracking-widest font-medium transition-all duration-300"
                  >
                    {isSoldOut ? "SOLD OUT" : "Add to cart"}
                  </Button>
                </motion.div>

                {/* Buy Now + Wishlist */}
                <motion.div variants={staggerItem} className="flex gap-3">
                  <Button
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={isSoldOut}
                    variant="outline"
                    className="flex-1 py-6 text-sm tracking-widest font-medium border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
                  >
                    Buy Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleToggleWishlist}
                    className={`px-5 py-6 border-border hover:border-foreground ${inWishlist ? "bg-primary/10 border-primary" : ""}`}
                  >
                    <Heart className={`w-5 h-5 ${inWishlist ? "fill-primary text-primary" : ""}`} />
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Product Details Tabs */}
        <section className="py-12 sm:py-16 bg-card/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-border/50 rounded-none h-auto p-0 gap-4 sm:gap-8 flex-wrap">
                  <TabsTrigger 
                    value="description" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 text-xs sm:text-sm tracking-wider"
                  >
                    DESCRIPTION
                  </TabsTrigger>
                  <TabsTrigger 
                    value="details" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 text-xs sm:text-sm tracking-wider"
                  >
                    DETAILS
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 text-xs sm:text-sm tracking-wider"
                  >
                    REVIEWS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="pt-8">
                  <div className="max-w-3xl">
                    <h3 className="text-2xl font-heading mb-4">About {product.name}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {product.story}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="pt-8">
                  <div className="grid sm:grid-cols-2 gap-8 max-w-3xl">
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b border-border/30">
                        <span className="text-muted-foreground">Category</span>
                        <span className="text-foreground">{product.category}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border/30">
                        <span className="text-muted-foreground">Available Sizes</span>
                        <span className="text-foreground">{product.size}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="py-3 border-b border-border/30">
                        <span className="text-muted-foreground block mb-2">Best For</span>
                        <div className="flex flex-wrap gap-2">
                          {product.occasion.map((o) => (
                            <span key={o} className="px-3 py-1 bg-card border border-border/50 text-sm">
                              {o}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="py-3 border-b border-border/30">
                        <span className="text-muted-foreground block mb-2">Materials</span>
                        <div className="flex flex-wrap gap-2">
                          {product.ingredients.map((m) => (
                            <span key={m} className="px-3 py-1 bg-card border border-border/50 text-sm">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="pt-8" id="reviews-section">
                  <ProductReviews productId={product.id} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </section>

        {/* Related Products */}
        <RelatedProducts currentProductId={product.id} currentCategory={product.category} />

        <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default memo(ProductDetail);
