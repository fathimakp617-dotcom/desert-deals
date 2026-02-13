import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { products } from "@/data/products";
import heroSneakers1 from "@/assets/shoes/hero-sneakers-1.jpg";
import heroSneakers2 from "@/assets/shoes/hero-sneakers-2.jpg";
import heroCollection from "@/assets/shoes/hero-collection.jpg";
import heroLifestyle from "@/assets/shoes/hero-lifestyle.jpg";

const slides = [
  {
    image: heroSneakers1,
    title: "Step Into Style & Comfort",
    productId: "air-stride",
  },
  {
    image: heroSneakers2,
    title: "Performance Meets Design",
    productId: "sport-runner",
  },
  {
    image: heroCollection,
    title: "Premium Shoe Collections",
    productId: "slam-dunk",
  },
  {
    image: heroLifestyle,
    title: "Elevate Every Step",
    productId: "urban-classic",
  },
];

const preloadFirstImage = () => {
  const img = new Image();
  img.src = heroSneakers1;
};
preloadFirstImage();

const Hero = memo(() => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleShopNow = () => {
    const currentProductId = slides[currentSlide].productId;
    const product = products.find(p => p.id === currentProductId);
    if (product) {
      addToCart(product, 1);
      navigate("/checkout");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative w-full mt-[100px]"
      style={{ height: "calc(100vh - 100px)" }}
    >
      {/* Background Slideshow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="w-full h-full object-cover object-center"
            loading={currentSlide === 0 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={currentSlide === 0 ? "high" : "auto"}
          />
          {/* Subtle bottom gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Centered bottom text */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-20 sm:pb-28">
        <div className="container mx-auto px-6 text-center">
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white tracking-tight"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
            >
              {slides[currentSlide].title}
            </motion.h1>
          </AnimatePresence>

          <div className="flex justify-center gap-4 mt-8">
            <Button
              size="lg"
              onClick={handleShopNow}
              className="bg-white text-foreground hover:bg-white/90 px-8 py-6 text-sm tracking-widest font-medium rounded-none"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              SHOP NOW
            </Button>
            <a href="#collection">
              <Button
                variant="outline"
                size="lg"
                className="border-foreground bg-foreground text-background hover:bg-foreground/80 px-8 py-6 text-sm tracking-widest font-medium rounded-none"
              >
                EXPLORE
              </Button>
            </a>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentSlide
                  ? "w-10 bg-white"
                  : "w-5 bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;
