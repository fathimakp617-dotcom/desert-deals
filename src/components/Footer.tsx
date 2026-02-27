import { memo } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, ArrowRight } from "lucide-react";
import desertDealLogo from "@/assets/desert-deal-logo-dark.png";

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
      {/* Accent top bar */}
      <div className="h-1 bg-destructive w-full" />

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
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
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
      <div className="container mx-auto px-6 lg:px-12 pb-6">
        <div className="flex justify-center sm:justify-end gap-2">
          {["VISA", "MC", "AMEX", "PAY", "COD"].map((method) => (
            <div
              key={method}
              className="w-12 h-8 rounded bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60 tracking-wider"
            >
              {method}
            </div>
          ))}
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
