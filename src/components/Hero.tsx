import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroSneakers1 from "@/assets/shoes/hero-sneakers-1.jpg";
import heroSneakers2 from "@/assets/shoes/hero-sneakers-2.jpg";

// Exact slides from the original HTML
const slides = [
  {
    image: heroSneakers1,
    title: "Ramadan Sale Live Now - Up To 75% Off",
  },
  {
    image: heroSneakers2,
    title: "Shop With Confidence and Convenience",
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
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section id="home" className="relative w-full mt-[56px] sm:mt-[64px]">
      {/* Exact heights from HTML: desktop 820px, tablet 520px, mobile 200px */}
      <div className="relative w-full h-[200px] sm:h-[520px] lg:h-[820px] rounded-lg overflow-hidden mx-auto">
        {/* Background Slideshow */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
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
            {/* Dark overlay - exactly 0.3 opacity like original */}
            <div className="absolute inset-0 bg-black/30" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />
        </button>

        {/* Centered content - exact layout from original */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center px-6 w-full max-w-[820px]">
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="text-lg sm:text-3xl md:text-4xl lg:text-6xl font-heading font-bold text-white tracking-tighter leading-tight"
              >
                {slides[currentSlide].title}
              </motion.h2>
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 sm:mt-8"
            >
              <button
                onClick={() => navigate("/shop")}
                className="bg-white text-foreground hover:bg-white/90 px-6 sm:px-10 py-2 sm:py-3.5 text-xs sm:text-sm tracking-wider font-medium rounded-full transition-all duration-300"
              >
                Shop Now
              </button>
            </motion.div>
          </div>
        </div>

        {/* Dots indicator - matching original style */}
        <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-white"
                  : "bg-[#f3f4f6]/50 hover:bg-white/70"
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
