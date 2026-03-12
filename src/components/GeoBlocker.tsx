import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const GeoBlocker = ({ children }: { children: React.ReactNode }) => {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Skip if already checked this session
    const cached = sessionStorage.getItem("dd_geo_ok");
    if (cached === "1") return;
    if (cached === "0") { setBlocked(true); return; }

    const checkGeoBlock = async () => {
      try {
        const { data: allowedCountries } = await supabase
          .from("allowed_countries")
          .select("country_code")
          .eq("is_active", true);

        if (!allowedCountries || allowedCountries.length === 0) {
          sessionStorage.setItem("dd_geo_ok", "1");
          return;
        }

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
          sessionStorage.setItem("dd_geo_ok", "0");
          setBlocked(true);
        } else {
          sessionStorage.setItem("dd_geo_ok", "1");
        }
      } catch {
        sessionStorage.setItem("dd_geo_ok", "1");
      }
    };

    checkGeoBlock();
  }, []);

  if (blocked) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
};
