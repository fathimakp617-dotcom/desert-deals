import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mindLocker from "@/assets/mind/mind-locker.jpeg";
import mindJump from "@/assets/mind/mind-jump.jpeg";
import mindSplit from "@/assets/mind/mind-split.jpeg";
import mindBottle from "@/assets/mind/mind-bottle.jpeg";
import mindXray from "@/assets/mind/mind-xray.jpeg";

const POPUP_KEY = "dd_mind_promo_shown";
const POPUP_DELAY = 3000;
const SLIDE_INTERVAL = 3500;

const slides = [
  { image: mindLocker, caption: "A Mind-Altering Shoe" },
  { image: mindJump, caption: "Activate Your Senses" },
  { image: mindSplit, caption: "Mind Science Department" },
  { image: mindBottle, caption: "Unlock Your Potential" },
  { image: mindXray, caption: "Engineered for Performance" },
];

const MindPromoPopup = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(POPUP_KEY)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(POPUP_KEY, "1");
    }, POPUP_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [open]);

  const goTo = useCallback((dir: 1 | -1) => {
    setCurrent((prev) => (prev + dir + slides.length) % slides.length);
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors z-20"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Discount badge */}
            <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              10% OFF
            </div>

            {/* Slideshow */}
            <div className="relative h-60 sm:h-72 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={current}
                  src={slides[current].image}
                  alt={slides[current].caption}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              {/* Caption */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={current}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-12 left-0 right-0 text-center text-white/80 text-xs font-medium tracking-wide uppercase"
                >
                  {slides[current].caption}
                </motion.p>
              </AnimatePresence>

              {/* Nav arrows */}
              <button
                onClick={() => goTo(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors z-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goTo(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors z-10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? "w-5 bg-white" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pt-4 pb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mb-1">
                Nike Mind<sup className="text-sm font-normal text-neutral-400 ml-0.5">001</sup>
              </h2>
              <p className="text-sm text-neutral-400 mb-5">
                A mind-altering shoe. Get 10% off the entire collection.
              </p>

              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/shop?search=Mind");
                }}
                className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-full hover:bg-red-700 transition-colors text-sm"
              >
                Shop Mind Collection →
              </button>

              <p className="text-[10px] text-neutral-500 mt-3">
                Discount applied automatically
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MindPromoPopup;
