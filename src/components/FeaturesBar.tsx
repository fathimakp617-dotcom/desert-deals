import { memo, useEffect, useState, useCallback } from "react";
import { Headphones, Truck, RotateCcw, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  const changeTo = useCallback((nextIdx: number) => {
    setVisible(false);
    setTimeout(() => { setCurrent(nextIdx); setVisible(true); }, 200);
  }, []);

  const next = useCallback(() => changeTo((current + 1) % features.length), [current, changeTo]);
  const prev = useCallback(() => changeTo((current - 1 + features.length) % features.length), [current, changeTo]);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  const Feature = features[current];

  return (
    <section className="py-6 sm:py-10 border-t-0 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        {/* Desktop: show all 4 */}
        <div className="hidden lg:grid grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <feature.icon className="w-10 h-10 text-foreground" strokeWidth={1.2} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground leading-tight">{feature.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile/Tablet: simple swap */}
        <div className="lg:hidden flex items-center gap-2">
          <button onClick={prev} className="p-1 text-muted-foreground hover:text-foreground shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className={`flex-1 flex items-center gap-3 justify-center text-center transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}>
            <Feature.icon className="w-8 h-8 text-foreground shrink-0" strokeWidth={1.2} />
            <div className="text-left">
              <h4 className="text-sm font-bold text-foreground leading-tight">{Feature.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{Feature.description}</p>
            </div>
          </div>
          <button onClick={next} className="p-1 text-muted-foreground hover:text-foreground shrink-0">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots - mobile only */}
        <div className="lg:hidden flex justify-center gap-1.5 mt-3">
          {features.map((_, idx) => (
            <button
              key={idx}
              onClick={() => changeTo(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${current === idx ? "bg-foreground w-3" : "bg-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesBar.displayName = "FeaturesBar";

export default FeaturesBar;
