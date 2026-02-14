import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import ContactSection from "@/components/Contact";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us | Desert Deal UAE</title>
        <meta
          name="description"
          content="Contact Desert Deal for premium shoes and accessories inquiries, orders, and support in UAE."
        />
        <meta name="keywords" content="contact Desert Deal, shoe store UAE, premium footwear, customer support" />
        <link rel="canonical" href="https://desertsdeals.com/contact" />
      </Helmet>

      <PageTransition>
        <main className="min-h-screen bg-background">
          <Navbar />
          <div className="pt-20">
            <ContactSection />
          </div>
          <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default Contact;
