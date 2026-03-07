import { memo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Truck, CreditCard, Package, AlertTriangle, Shield, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms & Conditions | Desert Deal UAE</title>
        <meta name="description" content="Terms and conditions for Desert Deal. Shipping policy, COD terms, and return/refund policies for UAE." />
        <meta name="keywords" content="Desert Deal terms, shoe shipping UAE, COD shoes, return policy, refund policy" />
        <link rel="canonical" href="https://desertsdeals.com/terms" />
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
            <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-4">Terms & Conditions</h1>
            <p className="text-muted-foreground mb-12">Last updated: March 2026</p>

            {/* Shipping Charges Section */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Shipping Policy</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Flat Delivery Charge</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      A flat delivery charge of <span className="text-primary font-semibold">25 AED</span> applies to all orders across the UAE.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Dubai, Abu Dhabi & Sharjah: 1-3 business days
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Other Emirates: 3-5 business days
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Tracking information will be provided via email once shipped
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We currently ship within the UAE only
                  </li>
                </ul>
              </div>
            </section>

            {/* Cash on Delivery Section */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Cash on Delivery (COD)</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Pay When You Receive</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All orders are <span className="text-orange-500 font-semibold">Cash on Delivery</span>. 
                      Pay the full amount (product price + 25 AED delivery charge) in cash when your order is delivered.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    COD is available for all orders within the UAE
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Please keep the exact amount ready at the time of delivery
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    No advance payment or online payment is required
                  </li>
                </ul>
              </div>
            </section>

            {/* Payment Terms */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Payment Terms</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We accept Cash on Delivery (COD) only
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    No online payment or prepayment is required
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Prices are listed in AED and inclusive of all applicable taxes
                  </li>
                </ul>
              </div>
            </section>

            {/* Returns & Refunds */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Returns & Refunds</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Returns accepted within 7 days of delivery for unopened products
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Products must be in original packaging and unused condition
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Refunds will be processed within 7-10 business days
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Delivery charges (25 AED) are non-refundable
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Return requests can be initiated from your account page
                  </li>
                </ul>
              </div>
            </section>

            {/* General Terms */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">General Terms</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    All products are 100% authentic and sourced from authorized distributors
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Product images are for illustration; actual products may vary slightly
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We reserve the right to cancel orders suspected of fraudulent activity
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Prices and offers are subject to change without prior notice
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    By placing an order, you agree to all terms stated herein
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    These terms are governed by the laws of the United Arab Emirates
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section className="text-center p-8 bg-card border border-border rounded-xl">
              <h3 className="text-xl font-heading text-foreground mb-2">Have Questions?</h3>
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

export default memo(Terms);
