import { useMemo, useRef, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useDbProducts } from "@/hooks/useDbProducts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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

const ReviewCard = ({ t }: { t: any }) => (
  <div className="w-[85vw] sm:w-[calc(33.333%-1rem)] flex-shrink-0 px-2">
    <div className="border border-border rounded-lg p-5 sm:p-6 flex flex-col bg-card h-full min-h-[180px]">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: t.stars }).map((_, s) => (
          <Star key={s} className="w-3.5 h-3.5 fill-foreground text-foreground" />
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

  // Marquee: duplicate items for seamless loop
  const marqueeItems = useMemo(() => [...testimonials, ...testimonials], [testimonials]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf: number;
    const speed = 0.5; // px per frame

    const step = () => {
      if (!paused && el) {
        el.scrollLeft += speed;
        // Reset to start when we've scrolled through the first set
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

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            What Our Customers Say
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Discover why our customers love shopping with us! Read their experiences and see why Desert Deal is their go-to online store.
          </p>
        </div>

        {/* Stats row on top */}
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

        {/* Continuously scrolling marquee carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => {
            setTimeout(() => setPaused(false), 3000);
          }}
        >
          {marqueeItems.map((t, i) => (
            <ReviewCard key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
