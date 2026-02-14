import { memo } from "react";
import { Link } from "react-router-dom";

// Exact footer structure from the original HTML
const Footer = memo(() => {
  return (
    <footer className="bg-background">
      {/* Footer widgets row - matches site-footer-row footer-widgets */}
      <div className="border-t border-border">
        <div className="container mx-auto px-6 lg:px-12 py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand column with logo */}
            <div className="space-y-4">
              <Link to="/">
                <h3 className="text-xl font-heading font-bold tracking-tight text-foreground uppercase">
                  DESERT DEAL
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your trusted destination for premium shoes and accessories across the UAE.
              </p>
            </div>

            {/* Empty column (matches original) */}
            <div></div>

            {/* Get to Know Us - exact links from original HTML */}
            <div className="space-y-4">
              <h4 className="text-base font-heading font-semibold text-foreground">
                Get to Know Us
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Home", to: "/" },
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms and Conditions", to: "/terms" },
                  { label: "Refund and Returns Policy", to: "/cancellation-refund-policy" },
                  { label: "About Us", to: "/#about" },
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

            {/* Sign Up for Email - matches original newsletter section */}
            <div className="space-y-4">
              <h4 className="text-base font-heading font-semibold text-foreground">
                Sign Up for Email
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Subscribe now and get early access to new arrivals, special discounts, exclusive deals, and Desert Deal updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar - matches site-row footer-copyright */}
      <div className="border-t border-border">
        <div className="container mx-auto px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            ©Desert Deal All rights reserved.
          </p>

          {/* Payment cards - matches site-payment-cards */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Visa</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">MasterCard</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
