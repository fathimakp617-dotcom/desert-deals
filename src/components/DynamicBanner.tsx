import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface DynamicBannerProps {
  imageUrl: string;
  images?: string[];
  linkUrl: string;
  buttonText?: string;
  title?: string;
}

const DynamicBanner = ({ imageUrl, images, linkUrl, buttonText, title }: DynamicBannerProps) => {
  const allImages = images && images.length > 0 ? images : [imageUrl];
  const isSlider = allImages.length > 1;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isSlider) return;
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % allImages.length), 4000);
    return () => clearInterval(timer);
  }, [isSlider, allImages.length]);

  return (
    <section className="bg-background">
      <div className="w-full py-6 sm:py-10">
        <Link to={linkUrl} className="block relative rounded-2xl overflow-hidden group">
          <div className="relative">
            {allImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={title || `Banner slide ${i + 1}`}
                width={1600}
                height={600}
                className={`w-full h-auto object-contain transition-opacity duration-700 ${
                  i === current ? "opacity-100" : "opacity-0 absolute inset-0"
                }`}
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
          {isSlider && (
            <div className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.preventDefault(); setCurrent(i); }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-foreground" : "bg-foreground/40"}`}
                />
              ))}
            </div>
          )}
          <div className="absolute bottom-8 sm:bottom-12 left-8 sm:left-14">
            <span className="inline-block w-fit bg-foreground text-background text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full group-hover:bg-foreground/90 transition-colors">
              {buttonText || "Shop Now →"}
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default DynamicBanner;
