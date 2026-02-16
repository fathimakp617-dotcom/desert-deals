import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import slide1 from "@/assets/banners/slide-1.webp";
import slide2 from "@/assets/banners/slide-2.png";
import slide3 from "@/assets/banners/slide-3.webp";
import slide4 from "@/assets/banners/slide-4.webp";

const slides = [
  { image: slide1, alt: "Ramadan Season - Premium Shoes Collection" },
  { image: slide2, alt: "Ramadan Sale - Family Collection" },
  { image: slide3, alt: "Ramadan Delivery - Shop Now" },
  { image: slide4, alt: "Ramadan Balance - New Balance Collection" },
];

const preloadFirstImage = () => {
  const img = new Image();
  img.src = slide1;
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

  {/* top offset: announcement bar (36px) + nav row1 (48-56px) + nav row2 (~28px) */}
  return (
    <section id="home" className="relative w-full mt-[100px] sm:mt-[116px]">
      <div className="relative w-full h-[300px] sm:h-[500px] lg:h-[calc(100vh-116px)] overflow-hidden mx-auto cursor-pointer" onClick={() => navigate("/shop")}>
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
              alt={slides[currentSlide].alt}
              className="w-full h-full object-cover object-center"
              loading={currentSlide === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={currentSlide === 0 ? "high" : "auto"}
            />
          </motion.div>
        </AnimatePresence>


        {/* Navigation Arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 text-foreground bg-background/80 hover:bg-background rounded-full p-2 transition-colors shadow"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 text-foreground bg-background/80 hover:bg-background rounded-full p-2 transition-colors shadow"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-white"
                  : "bg-white/40 hover:bg-white/70"
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
