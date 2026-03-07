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

  // Build pages of 3 reviews each
  const testimonialPages = useMemo(() => {
    const items = reviews && reviews.length >= 3
      ? reviews.map((r: any) => ({
          stars: r.rating,
          title: r.title || "Great Product!",
          text: r.comment || "",
          name: r.customer_name,
          product_id: r.product_id,
          photos: r.photos,
        }))
      : fallbackTestimonials;

    const pages: typeof items[] = [];
    for (let i = 0; i < items.length; i += 3) {
      const chunk = items.slice(i, i + 3);
      if (chunk.length === 3) pages.push(chunk);
    }
    return pages.length > 0 ? pages : [fallbackTestimonials];
  }, [reviews]);

  const next = useCallback(() => {
    setPage((p) => (p + 1) % testimonialPages.length);
  }, [testimonialPages.length]);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  // Reset page if pages change
  useEffect(() => {
    setPage(0);
  }, [testimonialPages.length]);

  const currentPage = testimonialPages[page] || testimonialPages[0];

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
          {/* Left half — Testimonial cards */}
          <div className="relative">
            <div className="space-y-4">
              {currentPage.map((t: any, i: number) => {
                const product = t.product_id
                  ? allProducts?.find((p) => p.id === t.product_id)
                  : null;

                return (
                  <div
                    key={`${page}-${i}`}
                    className="border border-border rounded-lg p-5 sm:p-6 flex flex-col bg-card"
                  >
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.stars }).map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-foreground text-foreground" />
                      ))}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground mb-1.5">{t.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">{t.text}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      </div>
                      {product && (
                        <Link to={`/product/${product.id}`} className="flex items-center gap-2 group">
                          <img
                            src={product.image || ""}
                            alt={product.name}
                            className="w-10 h-10 object-contain rounded"
                            loading="lazy"
                          />
                          <div className="hidden sm:block">
                            <p className="text-xs font-medium text-foreground group-hover:underline line-clamp-1">
                              {product.name}
                            </p>
                            <span className="text-xs font-semibold text-foreground">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        </Link>
                      )}
                      {t.photos && t.photos.length > 0 && !product && (
                        <img
                          src={t.photos[0]}
                          alt="Review photo"
                          className="w-10 h-10 object-cover rounded"
                          loading="lazy"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dots + arrow */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="flex gap-1.5">
                {testimonialPages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === page ? "bg-foreground w-4" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-border bg-card hover:bg-muted transition-colors"
                aria-label="Next testimonials"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* Right half — Stats */}
          <div className="flex flex-col justify-center divide-y divide-border border border-border rounded-lg bg-card">
            <div className="text-center py-10 sm:py-14 px-6">
              <p className="text-5xl sm:text-6xl font-bold text-muted-foreground/20 mb-2">4.5k</p>
              <h3 className="text-lg font-bold text-foreground mb-2">Happy Customers</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Desert Deal ensures a seamless shopping experience with top-quality products and excellent service. Your satisfaction is our priority!
              </p>
            </div>
            <div className="text-center py-10 sm:py-14 px-6">
              <p className="text-5xl sm:text-6xl font-bold text-muted-foreground/20 mb-2">456k</p>
              <h3 className="text-lg font-bold text-foreground mb-2">Total Sales Per Year</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
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
