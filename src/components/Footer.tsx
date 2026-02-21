import { memo } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, ChevronRight } from "lucide-react";
import desertDealLogo from "@/assets/desert-deal-logo-dark.png";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About Us", to: "/#about" },
  { label: "Contact", to: "/contact" },
];

const policyLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Refund & Returns", to: "/cancellation-refund-policy" },
  { label: "Shipping Policy", to: "/shipping-policy" },
];

const Footer = memo(() => {
  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container mx-auto px-6 lg:px-12 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-5">
            <Link to="/">
              <img src={desertDealLogo} alt="Desert Deal" className="h-20 w-auto" />
            </Link>
            <p className="text-sm text-background/50 leading-relaxed max-w-xs">
              Your destination for premium footwear. Authentic brands, unbeatable prices, delivered to your doorstep.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://wa.me/971501234567"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href="mailto:support@desertsdeals.com"
                className="w-9 h-9 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                aria-label="Location"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-heading font-bold uppercase tracking-widest text-background/80">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-background/50 hover:text-background flex items-center gap-1.5 transition-colors group"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h4 className="text-sm font-heading font-bold uppercase tracking-widest text-background/80">
              Policies
            </h4>
            <ul className="space-y-2.5">
              {policyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-background/50 hover:text-background flex items-center gap-1.5 transition-colors group"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-sm font-heading font-bold uppercase tracking-widest text-background/80">
              Stay Updated
            </h4>
            <p className="text-sm text-background/50 leading-relaxed">
              Get early access to new arrivals, exclusive deals & special discounts.
            </p>
            <div className="flex gap-0 mt-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-background/10 border border-background/20 rounded-l-lg px-4 py-2.5 text-sm text-background placeholder:text-background/40 focus:outline-none focus:border-background/40 transition-colors"
              />
              <button className="bg-background text-foreground text-sm font-medium px-5 py-2.5 rounded-r-lg hover:bg-background/90 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} Desert Deal. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {["Visa", "MasterCard", "COD"].map((method) => (
              <span
                key={method}
                className="text-[11px] text-background/50 border border-background/15 px-3 py-1 rounded-md font-medium tracking-wide"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
