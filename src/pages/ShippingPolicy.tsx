import { memo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Truck, MapPin, Clock, Package, AlertTriangle, CheckCircle, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Shipping Policy | Desert Deal UAE</title>
        <meta name="description" content="Shipping policy for Desert Deal. Free shipping on all orders in UAE. Fast delivery. COD available." />
        <meta name="keywords" content="Desert Deal shipping, shoe delivery UAE, free shipping, COD shoes, delivery time" />
        <link rel="canonical" href="https://desertsdeals.com/shipping-policy" />
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-4">Shipping Policy</h1>
            <p className="text-muted-foreground mb-12">Last updated: March 2026</p>

            {/* Shipping Charges */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Shipping Charges</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-primary" />
                    <p className="font-medium text-foreground">All Orders</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">25 AED</p>
                  <p className="text-sm text-muted-foreground">Flat delivery charge across the UAE</p>
                </div>
              </div>
            </section>

            {/* Delivery Time */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Delivery Time</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground mb-1">Dubai, Abu Dhabi, Sharjah</p>
                    <p className="text-xl font-bold text-primary">1-3 Business Days</p>
                    <p className="text-sm text-muted-foreground">Major emirates with fastest delivery</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium text-foreground mb-1">Other Emirates</p>
                    <p className="text-xl font-bold text-primary">3-5 Business Days</p>
                    <p className="text-sm text-muted-foreground">Ajman, RAK, Fujairah, Umm Al Quwain</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  * Delivery times may vary during peak seasons, holidays, or due to unforeseen circumstances.
                </p>
              </div>
            </section>

            {/* Service Area */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Service Area</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-lg mb-4">
                  <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">UAE-Wide Delivery</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      We deliver across all seven emirates of the United Arab Emirates.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We currently ship only within the UAE
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    All emirates are covered including remote areas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Please provide a complete address with emirate at checkout
                  </li>
                </ul>
              </div>
            </section>

            {/* COD Policy */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Cash on Delivery (COD)</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-lg mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Pay When You Receive</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pay the full amount (product + 25 AED delivery charge) in cash when your order is delivered to your door.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    COD is available for all addresses across the UAE
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Please keep the exact amount ready at delivery
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Order confirmation is sent via email immediately
                  </li>
                </ul>
              </div>
            </section>

            {/* Order Tracking */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Order Tracking</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Tracking number is sent via email once order is shipped
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Track your order in "My Orders" section of your account
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    SMS updates are sent at key delivery milestones
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Delivery confirmation sent upon successful delivery
                  </li>
                </ul>
              </div>
            </section>

            {/* Order Processing */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Order Processing</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Orders placed before 2 PM are processed same day
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Orders after 2 PM are processed next business day
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    No processing on Sundays and public holidays
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Order confirmation email sent immediately after placing order
                  </li>
                </ul>
              </div>
            </section>

            {/* Damaged/Lost Shipments */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Damaged or Lost Shipments</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Important: Unboxing Video</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      We recommend recording an unboxing video for all deliveries. This helps us process 
                      claims for damaged products quickly.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Report damaged packages within 24 hours of delivery
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Take photos of damaged packaging and products
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Contact support immediately for lost shipments
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Replacement or refund will be processed after investigation
                  </li>
                </ul>
              </div>
            </section>

            {/* Our Shipping Address */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Ships From</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-foreground font-medium">DESERT DEAL</p>
                <p className="text-muted-foreground mt-2">
                  United Arab Emirates
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="text-center p-8 bg-card border border-border rounded-xl">
              <h3 className="text-xl font-heading text-foreground mb-2">Shipping Questions?</h3>
              <p className="text-muted-foreground mb-4">
                Contact us at <a href="mailto:support@desertsdeals.com" className="text-primary hover:underline">support@desertsdeals.com</a>
                <br />
                or call us at <a href="tel:+971506784405" className="text-primary hover:underline">+971 50 678 4405</a>
              </p>
              <p className="text-sm text-muted-foreground">
                © 2026 Desert Deal. All rights reserved.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default memo(ShippingPolicy);