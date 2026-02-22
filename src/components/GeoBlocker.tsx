import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const GeoBlocker = ({ children }: { children: React.ReactNode }) => {
  const [blocked, setBlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkGeoBlock = async () => {
      try {
        // Fetch allowed countries (whitelist)
        const { data: allowedCountries } = await supabase
          .from("allowed_countries")
          .select("country_code")
          .eq("is_active", true);

        if (!allowedCountries || allowedCountries.length === 0) {
          setChecked(true);
          return;
        }

        const allowedCodes = new Set(allowedCountries.map(c => c.country_code));

        // Try multiple geo APIs for reliability
        let countryCode: string | null = null;

        try {
          const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
          if (res.ok) {
            const geo = await res.json();
            countryCode = geo.country_code || null;
          }
        } catch {}

        // Fallback API
        if (!countryCode) {
          try {
            const res = await fetch("https://ip2c.org/s", { signal: AbortSignal.timeout(4000) });
            if (res.ok) {
              const text = await res.text();
              const parts = text.split(";");
              if (parts[0] === "1" && parts[1]) {
                countryCode = parts[1];
              }
            }
          } catch {}
        }

        if (countryCode) {
          if (!allowedCodes.has(countryCode)) {
            setBlocked(true);
          }
        } else {
          // If all geo checks fail, block by default (fail closed)
          setBlocked(true);
        }
      } catch {
        // If everything fails, block by default
        setBlocked(true);
      }
      setChecked(true);
    };

    checkGeoBlock();
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (blocked) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
};
