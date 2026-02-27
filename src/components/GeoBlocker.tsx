import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const GeoBlocker = ({ children }: { children: React.ReactNode }) => {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Run geo check in the background without blocking render
    const checkGeoBlock = async () => {
      try {
        const { data: allowedCountries } = await supabase
          .from("allowed_countries")
          .select("country_code")
          .eq("is_active", true);

        if (!allowedCountries || allowedCountries.length === 0) return;

        const allowedCodes = new Set(allowedCountries.map(c => c.country_code));
        let countryCode: string | null = null;

        try {
          const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const geo = await res.json();
            countryCode = geo.country_code || null;
          }
        } catch {}

        if (!countryCode) {
          try {
            const res = await fetch("https://ip2c.org/s", { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
              const text = await res.text();
              const parts = text.split(";");
              if (parts[0] === "1" && parts[1]) countryCode = parts[1];
            }
          } catch {}
        }

        if (countryCode && !allowedCodes.has(countryCode)) {
          setBlocked(true);
        }
      } catch {}
    };

    checkGeoBlock();
  }, []);

  if (blocked) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
};
