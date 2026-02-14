import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroSneakers1 from "@/assets/shoes/hero-sneakers-1.jpg";
import heroSneakers2 from "@/assets/shoes/hero-sneakers-2.jpg";
import heroCollection from "@/assets/shoes/hero-collection.jpg";
import heroLifestyle from "@/assets/shoes/hero-lifestyle.jpg";

const slides = [
  {
    image: heroSneakers1,
    title: "Ramadan Sale Live Now\nUp To 75% Off",
  },
  {
    image: heroSneakers2,
    title: "Shop With Confidence\nand Convenience",
  },
  {
    image: heroCollection,
    title: "Premium Shoe\nCollections",
  },
  {
    image: heroLifestyle,
    title: "Elevate Every\nStep You Take",
  },
];

const preloadFirstImage = () => {
  const img = new Image();
  img.src = heroSneakers1;
};
preloadFirstImage();

const Hero = memo(() => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section
      id="home"
      className="relative w-full mt-[125px] sm:mt-[130px]"
      style={{ height: "clamp(300px, 65vh, 820px)" }}
    >
      {/* Background Slideshow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
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
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* Centered content */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="text-center px-6 max-w-[820px]">
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white tracking-tight leading-tight whitespace-pre-line"
            >
              {slides[currentSlide].title}
            </motion.h1>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <button
              onClick={() => navigate("/shop")}
              className="bg-white text-foreground hover:bg-white/90 px-8 sm:px-10 py-3 sm:py-4 text-sm tracking-wider font-medium rounded-full transition-all duration-300"
            >
              Shop Now
            </button>
          </motion.div>
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-white scale-110"
                : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;
