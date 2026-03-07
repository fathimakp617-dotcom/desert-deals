import { useState, useCallback, useEffect, useMemo } from "react";
import { ChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/data/products";
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
  },
  {
    stars: 5,
    title: "Trusted & Reliable",
    text: "I've been purchasing from Desert Deal for months now, and every order has been smooth. Great prices and quick delivery!",
    name: "Rahul Sharma",
    product_id: null,
  },
  {
    stars: 5,
    title: "Top-Notch Customer Service",
    text: "Shopping at Desert Deal has been a fantastic experience. The team is super responsive, and the products are always as described!",
    name: "Ayesha Khan",
    product_id: null,
  },
];

const Testimonials = () => {
  const [page, setPage] = useState(0);

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

  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    setCurrent(0);
  }, [testimonials.length]);

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

        {/* Two-column layout: Testimonials left, Stats right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left half — Auto-sliding carousel */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {testimonials.map((t: any, i: number) => {
                const product = t.product_id
                  ? allProducts?.find((p) => p.id === t.product_id)
                  : null;

                return (
                  <div
                    key={i}
                    className="w-full flex-shrink-0 px-1"
                  >
                    <div className="border border-border rounded-lg p-5 sm:p-6 flex flex-col bg-card h-full">
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
              })}
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {testimonials.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? "bg-foreground w-4" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right half — Stats */}
          <div className="flex flex-col justify-center divide-y divide-border border border-border rounded-lg bg-card">
            <div className="text-center py-6 sm:py-8 px-4">
              <p className="text-3xl sm:text-4xl font-bold text-muted-foreground/20 mb-1">4.5k</p>
              <h3 className="text-sm font-bold text-foreground mb-1">Happy Customers</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Desert Deal ensures a seamless shopping experience with top-quality products and excellent service. Your satisfaction is our priority!
              </p>
            </div>
            <div className="text-center py-6 sm:py-8 px-4">
              <p className="text-3xl sm:text-4xl font-bold text-muted-foreground/20 mb-1">456k</p>
              <h3 className="text-sm font-bold text-foreground mb-1">Total Sales Per Year</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                With thousands of successful transactions every month, Desert Deal is a trusted destination for premium products at unbeatable prices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
