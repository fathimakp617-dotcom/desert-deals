import aboutShoes from "@/assets/shoes/about-shoes.jpg";
import { useTranslation } from "@/contexts/DirectionContext";

const About = () => {
  const { t } = useTranslation();

  return (
    <section id="about" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 border border-primary/20" />
              <div className="absolute -inset-8 border border-primary/10" />
              <img
                src={aboutShoes}
                alt="Premium Footwear Collection"
                className="w-full object-cover relative z-10"
              />
              <div className="absolute -top-2 -start-2 w-12 h-12 border-t-2 border-s-2 border-primary z-20" />
              <div className="absolute -bottom-2 -end-2 w-12 h-12 border-b-2 border-e-2 border-primary z-20" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 sm:space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <p className="text-sm tracking-[0.4em] text-primary">{t("about.ourStory")}</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading tracking-tight leading-tight">
                {t("about.title")}
                <span className="block text-gold-gradient">{t("about.titleAccent")}</span>
              </h2>
              <div className="w-16 h-0.5 bg-primary" />
            </div>

            <div className="space-y-4 sm:space-y-6 text-muted-foreground leading-relaxed">
              <p>{t("about.p1")}</p>
              <p>{t("about.p2")}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-border/50">
              {[
                { number: "500+", label: t("about.stat.products") },
                { number: "50+", label: t("about.stat.brands") },
                { number: "100%", label: t("about.stat.authentic") },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-heading text-gold-gradient">
                    {stat.number}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground tracking-wider mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
