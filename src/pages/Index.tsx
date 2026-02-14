import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PageTransition from "@/components/PageTransition";
import { OrganizationSchema, LocalBusinessSchema, WebsiteSchema, FAQSchema } from "@/components/seo/JsonLd";

// Lazy load below-fold components - exact page order from HTML
const BrandCategories = lazy(() => import("@/components/BrandCategories"));
const PromoBanner = lazy(() => import("@/components/PromoBanner"));
const TopSellers = lazy(() => import("@/components/TopSellers"));
const About = lazy(() => import("@/components/About"));
const Contact = lazy(() => import("@/components/Contact"));
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
        <SignupIncentivePopup />
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
            <About />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <Contact />
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
