import { useState, useCallback, useEffect } from "react";
import { ChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";

const testimonials = [
  [
    {
      stars: 5,
      title: "Excellent Shopping Experience",
      text: "Desert Deal exceeded my expectations! Fast delivery, quality products, and great customer support. Highly recommended!",
      name: "Mohammed Ali",
      location: "Dubai, UAE",
    },
    {
      stars: 5,
      title: "Trusted & Reliable",
      text: "I've been purchasing from Desert Deal for months now, and every order has been smooth. Great prices and quick delivery!",
      name: "Rahul Sharma",
      location: "Sharjah, UAE",
    },
    {
      stars: 5,
      title: "Top-Notch Customer Service",
      text: "Shopping at Desert Deal has been a fantastic experience. The team is super responsive, and the products are always as described!",
      name: "Ayesha Khan",
      location: "Abu Dhabi, UAE",
    },
  ],
  [
    {
      stars: 5,
      title: "Best Prices in UAE",
      text: "I compared prices everywhere and Desert Deal consistently offers the best deals. The quality is amazing for the price!",
      name: "Omar Hassan",
      location: "Ajman, UAE",
    },
    {
      stars: 5,
      title: "Fast Shipping",
      text: "Ordered on Monday, received on Wednesday. The packaging was perfect and the shoes were exactly as shown. Will order again!",
      name: "Fatima Al-Rashid",
      location: "Dubai, UAE",
    },
    {
      stars: 5,
      title: "Amazing Collection",
      text: "The variety of brands available is impressive. Found exactly what I was looking for at an unbeatable price. Love it!",
      name: "Saeed Mohammed",
      location: "Ras Al Khaimah, UAE",
    },
  ],
];

const Testimonials = () => {
  const [page, setPage] = useState(0);

  const next = useCallback(() => {
    setPage((p) => (p + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  const { data: allProducts } = useDbProducts();
  const products = allProducts?.filter(p => p.image)?.slice(0, 3) || [];

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
              {testimonials[page].map((t, i) => (
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
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">{t.text}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location}</p>
                    </div>
                    {products && products[i] && (
                      <Link to={`/product/${products[i].id}`} className="flex items-center gap-2 group">
                        <img
                          src={products[i].image || ""}
                          alt={products[i].name}
                          className="w-10 h-10 object-contain rounded"
                          loading="lazy"
                        />
                        <div className="hidden sm:block">
                          <p className="text-xs font-medium text-foreground group-hover:underline line-clamp-1">
                            {products[i].name}
                          </p>
                          <span className="text-xs font-semibold text-foreground">
                            {formatPrice(products[i].price)}
                          </span>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Dots + arrow */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="flex gap-1.5">
                {testimonials.map((_, i) => (
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
