import { useState, useCallback, useEffect } from "react";
import { ChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  const [testimonialPage, setTestimonialPage] = useState(0);
  const [sectionPage, setSectionPage] = useState(0);

  const nextTestimonial = useCallback(() => {
    setTestimonialPage((p) => (p + 1) % testimonials.length);
  }, []);

  // Auto-cycle between testimonials and stats every 8s
  useEffect(() => {
    const timer = setInterval(() => {
      setSectionPage((p) => (p + 1) % 2);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Auto-cycle testimonial cards every 6s when visible
  useEffect(() => {
    if (sectionPage !== 0) return;
    const timer = setInterval(nextTestimonial, 6000);
    return () => clearInterval(timer);
  }, [nextTestimonial, sectionPage]);

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

        {/* Carousel — fade only, no sliding */}
        <div className="relative min-h-[420px] sm:min-h-[380px]">
          <AnimatePresence mode="wait">
            {sectionPage === 0 ? (
              <motion.div
                key="testimonials"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials[testimonialPage].map((t, i) => (
                      <div
                        key={`${testimonialPage}-${i}`}
                        className="border border-border rounded-lg p-6 sm:p-8 flex flex-col justify-between bg-card"
                      >
                        <div>
                          <div className="flex gap-0.5 mb-4">
                            {Array.from({ length: t.stars }).map((_, s) => (
                              <Star key={s} className="w-4 h-4 fill-foreground text-foreground" />
                            ))}
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{t.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t.text}</p>
                          <p className="text-sm font-semibold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground mb-6">{t.location}</p>
                        </div>

                        {products && products[i] && (
                          <div className="border-t border-border pt-4 mt-auto">
                            <Link to={`/product/${products[i].id}`} className="flex items-center gap-3 group">
                              <img
                                src={products[i].image || ""}
                                alt={products[i].name}
                                className="w-14 h-14 object-contain rounded"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground group-hover:underline line-clamp-1">
                                  {products[i].name}
                                </p>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="text-sm font-semibold text-foreground">
                                    {formatPrice(products[i].price)}
                                  </span>
                                  {products[i].originalPrice > products[i].price && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      {formatPrice(products[i].originalPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={nextTestimonial}
                    className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full border border-border bg-card hover:bg-muted transition-colors"
                    aria-label="Next testimonials"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                </div>

                {/* Testimonial sub-dots */}
                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialPage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === testimonialPage ? "bg-foreground w-4" : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-5xl sm:text-6xl font-bold text-muted-foreground/20 mb-2">4.5k</p>
                    <h3 className="text-lg font-bold text-foreground mb-2">Happy Customers</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Desert Deal ensures a seamless shopping experience with top-quality products and excellent service. Your satisfaction is our priority!
                    </p>
                  </div>
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-5xl sm:text-6xl font-bold text-muted-foreground/20 mb-2">456k</p>
                    <h3 className="text-lg font-bold text-foreground mb-2">Total Sales Per Year</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      With thousands of successful transactions every month, Desert Deal is a trusted destination for premium products at unbeatable prices.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1].map((i) => (
            <button
              key={i}
              onClick={() => setSectionPage(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === sectionPage ? "bg-foreground" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
