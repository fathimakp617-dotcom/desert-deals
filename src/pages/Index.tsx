import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PageTransition from "@/components/PageTransition";
import { OrganizationSchema, LocalBusinessSchema, WebsiteSchema, FAQSchema } from "@/components/seo/JsonLd";

// Lazy load below-fold components
const Collection = lazy(() => import("@/components/Collection"));
const About = lazy(() => import("@/components/About"));
const Contact = lazy(() => import("@/components/Contact"));
const Footer = lazy(() => import("@/components/Footer"));
const OrderSuccessModal = lazy(() => import("@/components/OrderSuccessModal"));
const CookieConsent = lazy(() => import("@/components/CookieConsent"));
const SignupIncentivePopup = lazy(() => import("@/components/SignupIncentivePopup"));

const SectionLoader = () => (
  <div className="py-12 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Desert Deal | Premium Shoes & Accessories in UAE | Shop Online</title>
        <meta
          name="description"
          content="Shop Desert Deal's exclusive collection of premium shoes and accessories online in UAE. Free shipping & COD available. Discover your style today."
        />
        <meta
          name="keywords"
          content="shoes UAE, buy shoes online, Desert Deal, premium footwear, sneakers, running shoes, designer shoes"
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
          
          {/* Lazy load below-the-fold content */}
          <Suspense fallback={<SectionLoader />}>
            <Collection />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <About />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <Contact />
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
