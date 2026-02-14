import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PageTransition from "@/components/PageTransition";
import { OrganizationSchema, LocalBusinessSchema, WebsiteSchema, FAQSchema } from "@/components/seo/JsonLd";

// Lazy load below-fold components
const BrandCategories = lazy(() => import("@/components/BrandCategories"));
const TopSellers = lazy(() => import("@/components/TopSellers"));
const FeaturesBar = lazy(() => import("@/components/FeaturesBar"));
const About = lazy(() => import("@/components/About"));
const Contact = lazy(() => import("@/components/Contact"));
const Footer = lazy(() => import("@/components/Footer"));
const OrderSuccessModal = lazy(() => import("@/components/OrderSuccessModal"));
const CookieConsent = lazy(() => import("@/components/CookieConsent"));
const SignupIncentivePopup = lazy(() => import("@/components/SignupIncentivePopup"));

const SectionLoader = () => (
  <div className="py-8 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
          content="shoes UAE, buy shoes online, Desert Deal, premium footwear, sneakers, Nike, Adidas, Jordan, running shoes"
        />
        <link rel="canonical" href="https://desertsdeals.com/" />
      </Helmet>
      
      {/* Structured Data */}
      <OrganizationSchema />
      <LocalBusinessSchema />
      <WebsiteSchema />
      <FAQSchema />

      {/* Defer modals loading */}
      <Suspense fallback={null}>
        <OrderSuccessModal />
        <CookieConsent />
        <SignupIncentivePopup />
      </Suspense>

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10">
          <Navbar />
          <Hero />
          
          <Suspense fallback={<SectionLoader />}>
            <BrandCategories />
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
        </main>
      </PageTransition>
    </>
  );
};

export default Index;
