import { memo } from "react";
import { Headphones, Truck, RotateCcw, CreditCard } from "lucide-react";

const features = [
  {
    icon: Headphones,
    title: "Customer service",
    description: "Friendly and responsive support, always ready to assist.",
  },
  {
    icon: Truck,
    title: "Fast COD Shipping",
    description: "Express 24-hour delivery across the UAE with COD.",
  },
  {
    icon: RotateCcw,
    title: "Returns & Exchanges",
    description: "Free returns for damaged items within days.",
  },
  {
    icon: CreditCard,
    title: "Secure payment",
    description: "Secure payment: COD (cash only) or online card payment",
  },
];

const FeaturesBar = memo(() => {
  return (
    <section className="py-10 sm:py-14 border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <feature.icon className="w-10 h-10 text-foreground" strokeWidth={1.2} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground leading-tight">
                  {feature.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesBar.displayName = "FeaturesBar";

export default FeaturesBar;
