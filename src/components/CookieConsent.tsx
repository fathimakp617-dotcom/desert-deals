import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "rayn-adam-cookie-consent";

const CookieConsent = memo(() => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsent) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading text-foreground flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-primary sm:hidden" />
                  We Value Your Privacy
                </h3>
                <button onClick={handleDecline} className="text-muted-foreground hover:text-foreground transition-colors sm:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies to enhance your browsing experience, remember your preferences, 
                and analyze site traffic. By clicking "Accept All", you consent to our use of cookies. 
                You can manage your preferences anytime.{" "}
                <Link to="/privacy" className="text-primary hover:underline">Learn more</Link>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={handleAccept} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 text-sm tracking-wider">
                  Accept All
                </Button>
                <Button onClick={handleDecline} variant="outline" className="border-border text-foreground hover:bg-muted px-6 py-2 text-sm tracking-wider">
                  Essential Only
                </Button>
              </div>
            </div>
            <button onClick={handleDecline} className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CookieConsent.displayName = "CookieConsent";

export default CookieConsent;
