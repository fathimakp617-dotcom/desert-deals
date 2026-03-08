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
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3">
          <p className="text-xs text-white/50 font-medium">We Accept:</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Visa */}
            <div className="w-12 h-8 rounded bg-white flex items-center justify-center p-1">
              <svg viewBox="0 0 48 32" className="w-10 h-5"><path d="M19.5 21h-3l1.9-11.5h3L19.5 21zm12.1-11.2c-.6-.2-1.5-.5-2.7-.5-3 0-5.1 1.5-5.1 3.7 0 1.6 1.5 2.5 2.6 3.1 1.2.6 1.6.9 1.6 1.4 0 .8-.9 1.1-1.8 1.1-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.5c.7.3 2 .6 3.4.6 3.2 0 5.2-1.5 5.3-3.8 0-1.3-.8-2.2-2.5-3-.6-.5-1.4-.8-1.4-1.3 0-.5.5-.9 1.5-.9.8 0 1.5.2 2 .4l.2.1.6-2.6zM36 21l2.4-11.5H36c-.7 0-1.3.2-1.6 1L30 21h3.2l.6-1.7h3.9l.3 1.7zm-2.7-4l1.6-4.3.9 4.3h-2.5zM16 9.5l-2.8 7.8-.3-1.5c-.5-1.7-2.1-3.6-3.9-4.5l2.7 9.7h3.2L19.2 9.5H16z" fill="#1A1F71"/><path d="M11 9.5H6l0 .2c3.8.9 6.3 3.2 7.3 5.8L12.2 10c-.2-.8-.8-1-1.2-1z" fill="#F9A533"/></svg>
            </div>
            {/* Mastercard */}
            <div className="w-12 h-8 rounded bg-white flex items-center justify-center p-1">
              <svg viewBox="0 0 48 32" className="w-10 h-5"><circle cx="17" cy="16" r="9" fill="#EB001B"/><circle cx="31" cy="16" r="9" fill="#F79E1B"/><path d="M24 9.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6z" fill="#FF5F00"/></svg>
            </div>
            {/* Amex */}
            <div className="w-12 h-8 rounded flex items-center justify-center p-1" style={{background:'#016fd0'}}>
              <svg viewBox="0 0 48 16" className="w-10 h-4"><text x="24" y="12" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="Arial,sans-serif">AMEX</text></svg>
            </div>
            {/* Apple Pay */}
            <div className="w-12 h-8 rounded bg-black flex items-center justify-center p-1">
              <svg viewBox="0 0 50 20" className="w-10 h-4"><path d="M9.4 3.2c.6-.8 1-1.8.9-2.9-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.8 1.1.1 2.2-.5 2.9-1.3zm2.9 1.5c-1.6-.1-3 .9-3.7.9s-2-.9-3.3-.8c-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4 0-2.5 2.1-3.7 2.2-3.8-1.2-1.8-3.1-2-3.9-2z" fill="#fff"/><text x="30" y="14" fill="#fff" fontSize="10" fontWeight="600" fontFamily="Arial,sans-serif">Pay</text></svg>
            </div>
            {/* Google Pay */}
            <div className="w-12 h-8 rounded bg-white flex items-center justify-center p-1 border border-gray-200">
              <svg viewBox="0 0 50 20" className="w-10 h-4"><text x="25" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="Arial,sans-serif"><tspan fill="#4285F4">G</tspan><tspan fill="#EA4335">P</tspan><tspan fill="#FBBC04">a</tspan><tspan fill="#4285F4">y</tspan></text></svg>
            </div>
            {/* Tabby */}
            <div className="w-12 h-8 rounded flex items-center justify-center p-1" style={{background:'#3BFFC0'}}>
              <svg viewBox="0 0 50 16" className="w-10 h-3.5"><text x="25" y="12" textAnchor="middle" fill="#292929" fontSize="10" fontWeight="bold" fontFamily="Arial,sans-serif">tabby</text></svg>
            </div>
            {/* Tamara */}
            <div className="w-12 h-8 rounded flex items-center justify-center p-1" style={{background:'#2B2458'}}>
              <svg viewBox="0 0 56 16" className="w-10 h-3.5"><text x="28" y="12" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="Arial,sans-serif">tamara</text></svg>
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
