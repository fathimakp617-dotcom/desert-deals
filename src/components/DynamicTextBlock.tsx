import { Link } from "react-router-dom";

interface DynamicTextBlockProps {
  heading?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

const DynamicTextBlock = ({ heading, description, buttonText, buttonLink }: DynamicTextBlockProps) => (
  <section className="bg-background">
    <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-16 text-center">
      {heading && <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">{heading}</h2>}
      {description && <p className="text-muted-foreground max-w-2xl mx-auto mb-6">{description}</p>}
      {buttonText && buttonLink && (
        <Link to={buttonLink} className="inline-block bg-foreground text-background text-sm font-medium px-8 py-3 rounded-full hover:bg-foreground/90 transition-colors">
          {buttonText}
        </Link>
      )}
    </div>
  </section>
);

export default DynamicTextBlock;
