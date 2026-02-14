import { memo } from "react";
import { Shield, Truck, RotateCcw, Lock } from "lucide-react";

// Exact features from original HTML footer iconboxes
const features = [
  {
    icon: Shield,
    title: "Quality Promise",
    description: "100% authentic products sourced from authorized distributors.",
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
    icon: Lock,
    title: "Secure payment",
    description: "Secure payment: COD (cash only) or online card payment",
  },
];

const FeaturesBar = memo(() => {
  return (
    <section className="py-8 sm:py-12 border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground leading-tight">
                  {feature.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
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
