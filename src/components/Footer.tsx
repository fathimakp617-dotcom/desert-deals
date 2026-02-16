import { memo } from "react";
import { Link } from "react-router-dom";
import desertDealLogo from "@/assets/desert-deal-logo-dark.png";

const Footer = memo(() => {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-6 lg:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Logo */}
          <div>
            <Link to="/">
              <img src={desertDealLogo} alt="Desert Deal" className="h-28 w-auto" />
            </Link>
          </div>

          {/* Get to Know Us */}
          <div className="space-y-4">
            <h4 className="text-base font-heading font-bold">
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
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sign Up for Email */}
          <div className="space-y-4">
            <h4 className="text-base font-heading font-bold">
              Sign Up for Email
            </h4>
            <p className="text-sm text-white/60 leading-relaxed">
              Subscribe now and get early access to new arrivals, special discounts, exclusive deals, and Desert Deal updates.
            </p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            ©Desert Deal All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 border border-white/20 px-2 py-1 rounded">Visa</span>
            <span className="text-xs text-white/40 border border-white/20 px-2 py-1 rounded">MasterCard</span>
            <span className="text-xs text-white/40 border border-white/20 px-2 py-1 rounded">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
