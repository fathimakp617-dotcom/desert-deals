import { Suspense, lazy, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PageTransition from "@/components/PageTransition";
import { OrganizationSchema, LocalBusinessSchema, WebsiteSchema, FAQSchema } from "@/components/seo/JsonLd";
import { useBanners } from "@/hooks/useBanners";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import onCloudAd from "@/assets/banners/on-cloud-ad.webp";
import nikeDunkAd from "@/assets/banners/nike-dunk-low-ad.webp";
import adidasAd from "@/assets/banners/adidas-ad.jpeg";

const BrandCategories = lazy(() => import("@/components/BrandCategories"));
const PromoBanner = lazy(() => import("@/components/PromoBanner"));
const PromoGrid = lazy(() => import("@/components/PromoGrid"));
const TopSellers = lazy(() => import("@/components/TopSellers"));
const About = lazy(() => import("@/components/About"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const BrandProductRow = lazy(() => import("@/components/BrandProductRow"));
const NewBalancePromoGrid = lazy(() => import("@/components/NewBalancePromoGrid"));
const FeaturesBar = lazy(() => import("@/components/FeaturesBar"));
const Footer = lazy(() => import("@/components/Footer"));
const MobileBottomNav = lazy(() => import("@/components/MobileBottomNav"));
const OrderSuccessModal = lazy(() => import("@/components/OrderSuccessModal"));
const CookieConsent = lazy(() => import("@/components/CookieConsent"));
const DynamicBanner = lazy(() => import("@/components/DynamicBanner"));
const DynamicTextBlock = lazy(() => import("@/components/DynamicTextBlock"));


const SectionLoader = () => (
  <div className="py-6 flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const BrandAdBanner = ({ position, fallbackImg, fallbackLink, fallbackAlt, children }: {
  position: string;
  fallbackImg: string;
  fallbackLink: string;
  fallbackAlt: string;
  children?: (banner: { image_url: string; link_url: string; title: string }) => React.ReactNode;
}) => {
  const { data: banners } = useBanners(position);
  const banner = banners?.[0];
  const imgSrc = banner?.image_url || fallbackImg;
  const link = banner?.link_url || fallbackLink;
  const alt = banner?.title || fallbackAlt;

  if (children) {
    return <>{children({ image_url: imgSrc, link_url: link, title: alt })}</>;
  }

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
        <Link to={link} className="block relative rounded-lg overflow-hidden group">
          <img src={imgSrc} alt={alt} className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover" />
          <div className="absolute bottom-8 sm:bottom-12 left-8 sm:left-14">
            <span className="inline-block w-fit bg-foreground text-background text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full group-hover:bg-foreground/90 transition-colors">
              Shop Now →
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
};

const Index = () => {
  const { data: sections, isLoading: sectionsLoading } = useHomepageSections();
  
  const visibleKeys = useMemo(() => {
    if (!sections) return new Set<string>();
    return new Set(sections.map(s => s.section_key));
  }, [sections]);

  const isVisible = (key: string) => !sections || visibleKeys.has(key);

  // Build ordered section components based on DB order
  const orderedSections = useMemo(() => {
    if (!sections || sections.length === 0) return null;

    const sectionMap: Record<string, React.ReactNode> = {
      brand_categories: <BrandCategories key="brand_categories" />,
      promo_banner: <PromoBanner key="promo_banner" />,
      top_sellers: <TopSellers key="top_sellers" />,
      promo_grid: <PromoGrid key="promo_grid" />,
      on_cloud_ad: (
        <BrandAdBanner key="on_cloud_ad" position="brand-ad-on" fallbackImg={onCloudAd} fallbackLink="/shop?brand=on-cloud" fallbackAlt="On Cloud Shoes" />
      ),
      on_cloud_collection: (
        <BrandProductRow key="on_cloud_collection" brand="on-cloud" title="On Cloud Collection" shopLink="/shop?brand=on-cloud" />
      ),
      adidas_ad: (
        <BrandAdBanner key="adidas_ad" position="brand-ad-adidas" fallbackImg={adidasAd} fallbackLink="/shop?brand=adidas" fallbackAlt="Adidas Shoes">
          {(banner) => (
            <section className="bg-background">
              <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
                <Link to={banner.link_url} className="block relative rounded-lg overflow-hidden group">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                  <div className="absolute inset-y-0 left-8 sm:left-14 flex flex-col justify-center gap-2 sm:gap-3">
                    <h3 className="text-white text-xl sm:text-3xl md:text-4xl font-bold tracking-tight drop-shadow-lg">{banner.title}</h3>
                    <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-xs sm:max-w-sm drop-shadow">Impossible is nothing. Explore the latest drops.</p>
                    <span className="inline-block w-fit bg-white text-black text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full group-hover:bg-white/90 transition-colors mt-1">
                      Shop Now →
                    </span>
                  </div>
                </Link>
              </div>
            </section>
          )}
        </BrandAdBanner>
      ),
      adidas_collection: <BrandProductRow key="adidas_collection" brand="adidas" title="Adidas Collection" />,
      nike_ad: (
        <BrandAdBanner key="nike_ad" position="brand-ad-nike" fallbackImg={nikeDunkAd} fallbackLink="/shop?brand=nike" fallbackAlt="Nike Dunk Low">
          {(banner) => (
            <section className="bg-background">
              <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
                <Link to={banner.link_url} className="block relative rounded-lg overflow-hidden group bg-white">
                  <img src={banner.image_url} alt={banner.title} className="w-full object-contain" />
                  <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2">
                    <span className="inline-block w-fit bg-foreground text-background text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full group-hover:bg-foreground/90 transition-colors">
                      Shop Now →
                    </span>
                  </div>
                </Link>
              </div>
            </section>
          )}
        </BrandAdBanner>
      ),
      nike_collection: <BrandProductRow key="nike_collection" brand="nike" title="Nike Collection" />,
      new_balance_promo: <NewBalancePromoGrid key="new_balance_promo" />,
      new_balance_collection: <BrandProductRow key="new_balance_collection" brand="new balance" title="New Balance Collection" />,
      asics_collection: <BrandProductRow key="asics_collection" brand="asics" title="Asics Collection" shopLink="/shop?brand=asics" />,
      testimonials: <Testimonials key="testimonials" />,
      features_bar: <FeaturesBar key="features_bar" />,
    };

    return sections
      .filter(s => sectionMap[s.section_key] || s.section_type === "product_row" || s.section_type === "banner" || s.section_type === "text_block")
      .map(s => {
        const cfg = (s.config || {}) as Record<string, any>;
        // If a built-in section has admin-configured images, use DynamicBanner instead of default
        if (sectionMap[s.section_key] && (cfg.images?.length > 0 || cfg.image_url)) {
          return <DynamicBanner key={s.id} imageUrl={cfg.image_url || cfg.images?.[0] || ""} images={cfg.images} linkUrl={cfg.link_url || "/shop"} buttonText={cfg.button_text} title={s.title} />;
        }
        if (sectionMap[s.section_key]) return sectionMap[s.section_key];
        if (s.section_type === "product_row" && cfg.brand) {
          return <BrandProductRow key={s.id} brand={cfg.brand} title={s.title} shopLink={cfg.shop_link} />;
        }
        if (s.section_type === "banner" && (cfg.image_url || cfg.images?.length)) {
          return <DynamicBanner key={s.id} imageUrl={cfg.image_url || cfg.images?.[0] || ""} images={cfg.images} linkUrl={cfg.link_url || "/shop"} buttonText={cfg.button_text} title={s.title} />;
        }
        if (s.section_type === "text_block") {
          return <DynamicTextBlock key={s.id} heading={cfg.heading || s.title} description={cfg.description || s.subtitle} buttonText={cfg.button_text} buttonLink={cfg.button_link} />;
        }
        return null;
      });
  }, [sections]);

  return (
    <>
      <Helmet>
        <title>Desert Deal – Shop With Confidence and Convenience</title>
        <meta name="description" content="Shop Desert Deal's exclusive collection of premium shoes online in UAE. Up to 75% off. Free shipping & COD available. Nike, Adidas, Jordan & more." />
        <meta name="keywords" content="shoes UAE, buy shoes online, Desert Deal, premium footwear, sneakers, Nike, Adidas, Jordan, running shoes, On Cloud, Hoka" />
        <link rel="canonical" href="https://desertsdeals.com/" />
      </Helmet>
      
      <OrganizationSchema />
      <LocalBusinessSchema />
      <WebsiteSchema />
      <FAQSchema />

      <Suspense fallback={null}>
        <OrderSuccessModal />
      </Suspense>

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10 pb-14 md:pb-0">
          <Navbar />
          {isVisible("hero") && <Hero />}
          
          <Suspense fallback={<SectionLoader />}>
            {orderedSections || (
              <>
                <BrandCategories />
                <PromoBanner />
                <TopSellers />
                <PromoGrid />
                <BrandAdBanner position="brand-ad-on" fallbackImg={onCloudAd} fallbackLink="/shop?brand=on-cloud" fallbackAlt="On Cloud Shoes" />
                <BrandProductRow brand="on-cloud" title="On Cloud Collection" shopLink="/shop?brand=on-cloud" />
                <BrandProductRow brand="adidas" title="Adidas Collection" />
                <BrandProductRow brand="nike" title="Nike Collection" />
                <NewBalancePromoGrid />
                <BrandProductRow brand="new balance" title="New Balance Collection" />
                <Testimonials />
                <FeaturesBar />
              </>
            )}
            <Footer />
          </Suspense>

          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </main>
      </PageTransition>

      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
    </>
  );
};

export default Index;
