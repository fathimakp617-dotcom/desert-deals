import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import slide5 from "@/assets/banners/slide-5.jpg";
import slide6 from "@/assets/banners/slide-6.png";
import slide7 from "@/assets/banners/slide-7.jpg";
import slide8 from "@/assets/banners/slide-8.webp";

const banners = [
  { image: slide5, alt: "Comfort and High Performance Shoes" },
  { image: slide6, alt: "Ramadan Collection - Best Sellers" },
  { image: slide7, alt: "On Cloud - Engineered for Comfort" },
  { image: slide8, alt: "Ramadan Season - Nike Collection" },
];

const PromoBanner = memo(() => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="py-2 sm:py-4 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div
          className="relative w-full aspect-[3/1] rounded-lg overflow-hidden cursor-pointer"
          onClick={() => navigate("/shop")}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              className="absolute inset-0"
            >
              <img
                src={banners[current].image}
                alt={banners[current].alt}
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white transition-colors bg-black/20 rounded-full p-1"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white transition-colors bg-black/20 rounded-full p-1"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrent(index); }}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                  index === current
                    ? "bg-white"
                    : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

PromoBanner.displayName = "PromoBanner";

export default PromoBanner;
