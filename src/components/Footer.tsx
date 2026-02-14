import { memo } from "react";
import { Instagram, Facebook } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = memo(() => {
  return (
    <footer className="bg-background border-t border-border">
      {/* Main footer */}
      <div className="container mx-auto px-6 lg:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-heading font-bold tracking-tight text-foreground">
              DESERT DEAL
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your trusted destination for premium shoes and accessories across the UAE.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <Instagram size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>

          {/* Get to Know Us */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Get to Know Us
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Home", to: "/" },
                { label: "About Us", to: "/#about" },
                { label: "Shop", to: "/shop" },
                { label: "Contact", to: "/#contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Policies
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Privacy Policy", to: "/privacy" },
                { label: "Terms & Conditions", to: "/terms" },
                { label: "Refund & Returns", to: "/cancellation-refund-policy" },
                { label: "Shipping Policy", to: "/shipping-policy" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Sign Up for Email
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Subscribe now and get early access to new arrivals, special discounts, and Desert Deal updates.
            </p>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            ©Desert Deal All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>💳</span>
            <span>Visa</span>
            <span>•</span>
            <span>MasterCard</span>
            <span>•</span>
            <span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
