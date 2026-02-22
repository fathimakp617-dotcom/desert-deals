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
          // No whitelist configured — allow everyone
          setChecked(true);
          return;
        }

        const allowedCodes = new Set(allowedCountries.map(c => c.country_code));

        // Use a free geo IP API to get user's country
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const geo = await res.json();
          if (geo.country_code && !allowedCodes.has(geo.country_code)) {
            setBlocked(true);
          }
        }
      } catch {
        // If geo check fails, allow access
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
