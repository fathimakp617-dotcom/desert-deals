import { Link } from "react-router-dom";

interface DynamicBannerProps {
  imageUrl: string;
  linkUrl: string;
  buttonText?: string;
  title?: string;
}

const DynamicBanner = ({ imageUrl, linkUrl, buttonText, title }: DynamicBannerProps) => (
  <section className="bg-background">
    <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
      <Link to={linkUrl} className="block relative rounded-lg overflow-hidden group">
        <img src={imageUrl} alt={title || "Banner"} className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover" loading="lazy" />
        <div className="absolute bottom-8 sm:bottom-12 left-8 sm:left-14">
          <span className="inline-block w-fit bg-foreground text-background text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full group-hover:bg-foreground/90 transition-colors">
            {buttonText || "Shop Now →"}
          </span>
        </div>
      </Link>
    </div>
  </section>
);

export default DynamicBanner;
