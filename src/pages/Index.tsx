import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PageTransition from "@/components/PageTransition";
import { OrganizationSchema, LocalBusinessSchema, WebsiteSchema, FAQSchema } from "@/components/seo/JsonLd";
import { useBanners } from "@/hooks/useBanners";
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
const SignupIncentivePopup = lazy(() => import("@/components/SignupIncentivePopup"));

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
          <Hero />
          
          <Suspense fallback={<SectionLoader />}>
            <BrandCategories />
            <PromoBanner />
            <TopSellers />
            <PromoGrid />
          </Suspense>

          {/* On Cloud Ad Banner */}
          <BrandAdBanner position="brand-ad-on" fallbackImg={onCloudAd} fallbackLink="/shop?brand=on-cloud" fallbackAlt="On Cloud Shoes" />

          <Suspense fallback={<SectionLoader />}>
            <BrandProductRow brand="on" title="On Cloud Collection" shopLink="/shop?brand=on-cloud" />

          {/* Adidas Ad Banner */}
          <BrandAdBanner position="brand-ad-adidas" fallbackImg={adidasAd} fallbackLink="/shop?brand=adidas" fallbackAlt="Adidas Shoes">
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

            <BrandProductRow brand="adidas" title="Adidas Collection" />

          {/* Nike Dunk Low Ad Banner */}
          <BrandAdBanner position="brand-ad-nike" fallbackImg={nikeDunkAd} fallbackLink="/shop?brand=nike" fallbackAlt="Nike Dunk Low">
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

            <BrandProductRow brand="nike" title="Nike Collection" />
            <NewBalancePromoGrid />
            <BrandProductRow brand="new balance" title="New Balance Collection" />
            <Testimonials />
            <FeaturesBar />
            <Footer />
          </Suspense>

          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </main>
      </PageTransition>
    </>
  );
};

export default Index;
