import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header accent */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="px-6 pt-8 pb-6 text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Limited Offer
              </div>

              <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-2">
                10% OFF
              </h2>
              <p className="text-lg font-semibold text-foreground mb-1">
                Nike Mind Collection
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Elevate your style with the exclusive Mind series. Premium comfort meets bold design.
              </p>

              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/shop?search=Mind");
                }}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-full hover:opacity-90 transition-opacity text-sm"
              >
                Shop Mind Collection →
              </button>

              <p className="text-[11px] text-muted-foreground mt-3">
                Discount applied automatically on all Mind products
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MindPromoPopup;
