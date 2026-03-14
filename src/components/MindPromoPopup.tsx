import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mindHero from "@/assets/mind/mind-locker.jpeg";

const POPUP_KEY = "dd_mind_promo_shown";
const POPUP_DELAY = 3000;

const MindPromoPopup = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(POPUP_KEY)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(POPUP_KEY, "1");
    }, POPUP_DELAY);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors z-20"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Hero image */}
            <div className="relative h-56 sm:h-64 overflow-hidden">
              <img
                src={mindHero}
                alt="Nike Mind 001"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              
              {/* Discount badge */}
              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                10% OFF
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pt-4 pb-6 text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-1">
                Limited Time Offer
              </p>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mb-1">
                Nike Mind<sup className="text-sm font-normal text-neutral-400 ml-0.5">001</sup>
              </h2>
              <p className="text-sm text-neutral-400 mb-5">
                A mind-altering shoe. Activate your senses.
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
