import { memo } from "react";
import { Link } from "react-router-dom";
import { Instagram, ArrowRight } from "lucide-react";
import desertDealLogo from "@/assets/desert-deal-logo-dark.png";
import visaLogo from "@/assets/payments/visa.svg";
import mastercardLogo from "@/assets/payments/mastercard.svg";
import amexLogo from "@/assets/payments/amex.png";
import applePayLogo from "@/assets/payments/apple-pay.png";
import tabbyLogo from "@/assets/payments/tabby.png";
import tamaraLogo from "@/assets/payments/tamara.jpeg";
import cashLogo from "@/assets/payments/cash.png";

const quickLinks = [
  { label: "Shipping Information", to: "/shipping-policy" },
  { label: "Returns & Refunds", to: "/cancellation-refund-policy" },
  { label: "Track Your Order", to: "/account" },
  { label: "Help & FAQs", to: "/contact" },
];

const aboutLinks = [
  { label: "About Us", to: "/#about" },
  { label: "Our Brands", to: "/shop" },
  { label: "Contact Us", to: "/contact" },
];

const bottomPolicyLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Shipping Policy", to: "/shipping-policy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Returns Policy", to: "/cancellation-refund-policy" },
];

const Footer = memo(() => {
  return (
    <footer className="bg-black text-white overflow-x-hidden">
      {/* Accent top bar removed */}

      {/* Main Footer */}
      <div className="container mx-auto px-6 lg:px-12 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="space-y-5 flex flex-col items-center sm:items-start">
            <Link to="/">
              <img src={desertDealLogo} alt="Desert Deal" className="h-16 w-auto" />
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs text-center sm:text-left">
              Your destination for premium footwear. Authentic brands, unbeatable prices, delivered across the UAE.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://www.instagram.com/desertdeal.ae/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/971501234567"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          {/* Delivery & Returns */}
          <div className="space-y-4">
            <h4 className="text-sm font-heading font-bold uppercase tracking-widest text-white">
              Delivery & Returns
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h4 className="text-sm font-heading font-bold uppercase tracking-widest text-white">
              About Desert Deal
            </h4>
            <ul className="space-y-3">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-sm font-heading font-bold uppercase tracking-widest text-white">
              Sign up to our newsletter
            </h4>
            <p className="text-sm text-white/50 leading-relaxed">
              Sign up for exclusive offers, original stories, events and more.
            </p>
            <div className="relative mt-2 w-full max-w-full">
              <input
                type="email"
                placeholder="Your email"
                className="w-full bg-white rounded-full px-5 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors pr-12"
              />
              <button
                className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="container mx-auto px-6 lg:px-12 pb-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-white/40 font-medium uppercase tracking-widest">We Accept</p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="w-14 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center p-1.5 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <img src={visaLogo} alt="Visa" className="h-3.5 w-auto brightness-0 invert" />
            </div>
            <div className="w-14 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center p-1.5 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <img src={mastercardLogo} alt="Mastercard" className="h-5 w-auto" />
            </div>
            <div className="w-14 h-9 rounded-lg bg-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center p-1 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <img src={amexLogo} alt="American Express" className="h-7 w-auto object-contain rounded" />
            </div>
            <div className="w-14 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center p-1.5 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <img src={applePayLogo} alt="Apple Pay" className="h-5 w-auto brightness-0 invert" />
            </div>
            <div className="w-14 h-9 rounded-lg bg-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center p-1 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <img src={tabbyLogo} alt="Tabby" className="h-7 w-auto object-contain rounded" />
            </div>
            <div className="w-14 h-9 rounded-lg bg-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center p-1 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <img src={tamaraLogo} alt="Tamara" className="h-7 w-auto object-contain rounded" />
            </div>
            <div className="w-14 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center p-1.5 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <img src={cashLogo} alt="Cash on Delivery" className="h-5 w-auto brightness-0 invert" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Desert Deal. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {bottomPolicyLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
