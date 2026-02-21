import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const getSessionId = () => {
  let sid = sessionStorage.getItem("dd_session_id");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("dd_session_id", sid);
  }
  return sid;
};

const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
  };
};

export const usePageTracking = () => {
  const location = useLocation();
  const lastTracked = useRef("");

  useEffect(() => {
    const key = location.pathname + location.search;
    if (key === lastTracked.current) return;
    lastTracked.current = key;

    const productMatch = location.pathname.match(/^\/product\/(.+)$/);
    const productId = productMatch ? productMatch[1] : null;

    const utm = getUtmParams();

    // Fire and forget - don't await
    supabase.functions.invoke("track-pageview", {
      body: {
        product_id: productId,
        page_path: location.pathname,
        referrer: document.referrer || "",
        ...utm,
        session_id: getSessionId(),
      },
    }).catch(() => {
      // Silently ignore tracking errors
    });
  }, [location.pathname, location.search]);
};
