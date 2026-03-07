import { useMemo, useRef, useEffect, useState } from "react";
import { Star, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useDbProducts } from "@/hooks/useDbProducts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const fallbackTestimonials = [
  {
    stars: 5,
    title: "Excellent Shopping Experience",
    text: "Desert Deal exceeded my expectations! Fast delivery, quality products, and great customer support. Highly recommended!",
    name: "Mohammed Ali",
    product_id: null,
    photos: null,
  },
  {
    stars: 5,
    title: "Trusted & Reliable",
    text: "I've been purchasing from Desert Deal for months now, and every order has been smooth. Great prices and quick delivery!",
    name: "Rahul Sharma",
    product_id: null,
    photos: null,
  },
  {
    stars: 5,
    title: "Top-Notch Customer Service",
    text: "Shopping at Desert Deal has been a fantastic experience. The team is super responsive, and the products are always as described!",
    name: "Ayesha Khan",
    product_id: null,
    photos: null,
  },
];

const ReviewCard = ({ t, onClick }: { t: any; onClick: () => void }) => (
  <div className="w-[85vw] sm:w-[calc(33.333%-1rem)] flex-shrink-0 px-2">
    <div
      onClick={onClick}
      className="border border-border rounded-lg p-5 sm:p-6 flex flex-col bg-card h-full min-h-[180px] cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: t.stars }).map((_, s) => (
          <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <h3 className="text-sm sm:text-base font-bold text-foreground mb-1.5">{t.title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">{t.text}</p>
      {t.photos && t.photos.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {t.photos.slice(0, 3).map((photo: string, pi: number) => (
            <img
              key={pi}
              src={photo}
              alt={`Review photo ${pi + 1}`}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md border border-border"
              loading="lazy"
            />
          ))}
          {t.photos.length > 3 && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md border border-border bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
              +{t.photos.length - 3}
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 mt-auto">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {t.name?.charAt(0)?.toUpperCase() || "V"}
        </div>
        <p className="text-sm font-semibold text-foreground">{t.name}</p>
      </div>
    </div>
  </div>
);

const ImageLightbox = ({
  images,
  initialIndex,
  open,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
            }}
            className="absolute left-4 text-white/80 hover:text-white z-10"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % images.length);
            }}
            className="absolute right-4 text-white/80 hover:text-white z-10"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}

      <img
        src={images[currentIndex]}
        alt={`Review photo ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Testimonials = () => {
  const { data: reviews } = useQuery({
    queryKey: ["testimonial-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews_public")
        .select("*")
        .eq("is_approved", true)
        .gte("rating", 4)
        .not("comment", "is", null)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allProducts } = useDbProducts();

  const testimonials = useMemo(() => {
    if (reviews && reviews.length >= 3) {
      return reviews.map((r: any) => ({
        stars: r.rating,
        title: r.title || "Great Product!",
        text: r.comment || "",
        name: r.customer_name,
        product_id: r.product_id,
        photos: r.photos,
      }));
    }
    return fallbackTestimonials;
  }, [reviews]);

  const marqueeItems = useMemo(() => [...testimonials, ...testimonials], [testimonials]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf: number;
    const speed = 0.5;

    const step = () => {
      if (!paused && el) {
        el.scrollLeft += speed;
        const halfWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, marqueeItems]);

  const productName = useMemo(() => {
    if (!selectedReview?.product_id || !allProducts) return null;
    const p = allProducts.find((pr: any) => pr.id === selectedReview.product_id);
    return p?.name || null;
  }, [selectedReview, allProducts]);

  return (
    <>
      <section id="testimonials" className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              What Our Customers Say
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Discover why our customers love shopping with us! Read their experiences and see why Desert Deal is their go-to online store.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center py-6 sm:py-8 px-4 border border-border rounded-lg bg-card">
              <p className="text-3xl sm:text-4xl font-bold text-muted-foreground/20 mb-1">4.5k</p>
              <h3 className="text-sm font-bold text-foreground mb-1">Happy Customers</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Desert Deal ensures a seamless shopping experience with top-quality products and excellent service.
              </p>
            </div>
            <div className="text-center py-6 sm:py-8 px-4 border border-border rounded-lg bg-card">
              <p className="text-3xl sm:text-4xl font-bold text-muted-foreground/20 mb-1">456k</p>
              <h3 className="text-sm font-bold text-foreground mb-1">Total Sales Per Year</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                With thousands of successful transactions every month, Desert Deal is a trusted destination.
              </p>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => {
              setTimeout(() => setPaused(false), 3000);
            }}
          >
            {marqueeItems.map((t, i) => (
              <ReviewCard
                key={i}
                t={t}
                onClick={() => {
                  setPaused(true);
                  setSelectedReview(t);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Review Detail Dialog */}
      <Dialog
        open={!!selectedReview}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReview(null);
            setPaused(false);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogTitle className="sr-only">Review Details</DialogTitle>
          {selectedReview && (
            <div className="space-y-4">
              {/* Reviewer info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {selectedReview.name?.charAt(0)?.toUpperCase() || "V"}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedReview.name}</p>
                  {productName && (
                    <p className="text-xs text-muted-foreground">Reviewed: {productName}</p>
                  )}
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: selectedReview.stars }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Title & full text */}
              <h3 className="text-lg font-bold text-foreground">{selectedReview.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {selectedReview.text}
              </p>

              {/* Photos grid - clickable */}
              {selectedReview.photos && selectedReview.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedReview.photos.map((photo: string, pi: number) => (
                    <img
                      key={pi}
                      src={photo}
                      alt={`Review photo ${pi + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                      loading="lazy"
                      onClick={() => {
                        setLightboxIndex(pi);
                        setLightboxOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {selectedReview?.photos && (
        <ImageLightbox
          images={selectedReview.photos}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};

export default Testimonials;
