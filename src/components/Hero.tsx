import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBanners } from "@/hooks/useBanners";
import slide1 from "@/assets/banners/slide-9.webp";
import slide2 from "@/assets/banners/slide-10.png";

const fallbackSlides = [
  { image: slide1, alt: "Shopping Sale - Desert Deal", link: "/shop" },
  { image: slide2, alt: "Ramadan Season - Family Collection", link: "/shop" },
];

const Hero = memo(() => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { data: heroBanners } = useBanners("hero");

  const slides = heroBanners && heroBanners.length > 0
    ? heroBanners.map(b => ({ image: b.image_url, alt: b.title, link: b.link_url }))
    : fallbackSlides;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section id="home" className="relative w-full mt-[100px] sm:mt-[116px] px-3 sm:px-4">
      <div className="relative w-full aspect-[16/9] sm:aspect-[16/7] lg:h-[calc(100vh-116px)] overflow-hidden mx-auto cursor-pointer bg-muted rounded-xl sm:rounded-2xl" onClick={() => navigate(slides[currentSlide]?.link || "/shop")}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: index === currentSlide ? 1 : 0 }}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full h-full object-cover object-center"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={index === 0 ? "high" : "auto"}
            />
          </div>
        ))}

        <div className="absolute inset-x-0 top-0 h-24 sm:h-32 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none rounded-t-xl sm:rounded-t-2xl" />

        <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-white" : "bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;
