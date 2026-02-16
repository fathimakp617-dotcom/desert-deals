import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PageTransition from "@/components/PageTransition";
import { OrganizationSchema, LocalBusinessSchema, WebsiteSchema, FAQSchema } from "@/components/seo/JsonLd";
import onCloudAd from "@/assets/banners/on-cloud-ad.webp";
import nikeDunkAd from "@/assets/banners/nike-dunk-low-ad.webp";


// Lazy load below-fold components - exact page order from HTML
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

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Desert Deal – Shop With Confidence and Convenience</title>
        <meta
          name="description"
          content="Shop Desert Deal's exclusive collection of premium shoes online in UAE. Up to 75% off. Free shipping & COD available. Nike, Adidas, Jordan & more."
        />
        <meta
          name="keywords"
          content="shoes UAE, buy shoes online, Desert Deal, premium footwear, sneakers, Nike, Adidas, Jordan, running shoes, On Cloud, Hoka"
        />
        <link rel="canonical" href="https://desertsdeals.com/" />
      </Helmet>
      
      <OrganizationSchema />
      <LocalBusinessSchema />
      <WebsiteSchema />
      <FAQSchema />

      <Suspense fallback={null}>
        <OrderSuccessModal />
        <CookieConsent />
      </Suspense>

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10 pb-14 md:pb-0">
          <Navbar />
          
          {/* Exact page section order from HTML:
              1. Hero slider
              2. Brand categories carousel
              3. Promotional banner
              4. Top Sellers product carousel
              5. About section
              6. Contact section
              7. Features bar (iconboxes)
              8. Footer
              9. Mobile bottom nav
          */}
          <Hero />
          
          <Suspense fallback={<SectionLoader />}>
            <BrandCategories />
          </Suspense>

          <Suspense fallback={<SectionLoader />}>
            <PromoBanner />
          </Suspense>

          <Suspense fallback={<SectionLoader />}>
            <TopSellers />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <PromoGrid />
          </Suspense>

          <Suspense fallback={<SectionLoader />}>
            <BrandProductRow brand="adidas" title="Adidas Collection" />
          </Suspense>

          {/* On Cloud Ad Banner */}
          <section className="bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
              <Link to="/shop?brand=on-cloud" className="block relative rounded-lg overflow-hidden group">
                <img src={onCloudAd} alt="On Cloud Shoes" className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover" />
                <div className="absolute bottom-8 sm:bottom-12 left-8 sm:left-14">
                  <span className="inline-block w-fit bg-foreground text-background text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full group-hover:bg-foreground/90 transition-colors">
                    Shop Now →
                  </span>
                </div>
              </Link>
            </div>
          </section>

          <Suspense fallback={<SectionLoader />}>
            <BrandProductRow brand="nike" title="Nike Collection" />
          </Suspense>

          {/* Nike Dunk Low Ad Banner */}
          <section className="bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
              <Link to="/shop?brand=nike" className="block relative rounded-lg overflow-hidden group bg-white">
                <img src={nikeDunkAd} alt="Nike Dunk Low" className="w-full object-contain" />
                <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2">
                  <span className="inline-block w-fit bg-foreground text-background text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full group-hover:bg-foreground/90 transition-colors">
                    Shop Now →
                  </span>
                </div>
              </Link>
            </div>
          </section>

          <Suspense fallback={<SectionLoader />}>
            <BrandProductRow brand="new balance" title="New Balance Collection" />
          </Suspense>

          <Suspense fallback={<SectionLoader />}>
            <NewBalancePromoGrid />
          </Suspense>

          <Suspense fallback={<SectionLoader />}>
            <Testimonials />
          </Suspense>

          <Suspense fallback={<SectionLoader />}>
            <FeaturesBar />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
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
