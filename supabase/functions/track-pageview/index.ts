import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { product_id, page_path, referrer, utm_source, utm_medium, utm_campaign, session_id } = body;

    if (!page_path) {
      return new Response(JSON.stringify({ error: "page_path required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get country from Cloudflare headers (available on edge)
    const countryCode = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null;

    const { error } = await supabaseClient.from("page_views").insert({
      product_id: product_id || null,
      page_path: (page_path || "").slice(0, 500),
      referrer: (referrer || "").slice(0, 1000) || null,
      utm_source: (utm_source || "").slice(0, 100) || null,
      utm_medium: (utm_medium || "").slice(0, 100) || null,
      utm_campaign: (utm_campaign || "").slice(0, 100) || null,
      country_code: countryCode,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 500) || null,
      session_id: (session_id || "").slice(0, 100) || null,
    });

    if (error) {
      console.error("Error tracking pageview:", error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("track-pageview error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
