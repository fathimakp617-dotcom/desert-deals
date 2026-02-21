import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { admin_email, admin_token, date_from, date_to } = body;

    // Validate admin session
    if (!admin_email || !admin_token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: session, error: sessionError } = await supabaseClient
      .from("staff_sessions")
      .select("email, expires_at")
      .eq("session_token", admin_token)
      .eq("email", admin_email.toLowerCase())
      .single();

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminEmails = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map(e => e.trim().toLowerCase());
    const isEnvAdmin = adminEmails.includes(session.email.toLowerCase());
    if (!isEnvAdmin) {
      const { data: staff } = await supabaseClient
        .from("staff_members")
        .select("role")
        .eq("email", session.email)
        .single();
      if (!staff || staff.role !== "admin") {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const from = date_from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const to = date_to || new Date().toISOString();

    // Top viewed products
    const { data: topProducts } = await supabaseClient
      .from("page_views")
      .select("product_id, page_path")
      .not("product_id", "is", null)
      .gte("created_at", from)
      .lte("created_at", to);

    const productCounts: Record<string, number> = {};
    (topProducts || []).forEach(v => {
      if (v.product_id) productCounts[v.product_id] = (productCounts[v.product_id] || 0) + 1;
    });
    const topProductsList = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, views]) => ({ product_id: id, views }));

    // Enrich with product names
    const productIds = topProductsList.map(p => p.product_id);
    const { data: productNames } = await supabaseClient
      .from("products")
      .select("id, name, image_url")
      .in("id", productIds.length ? productIds : ["__none__"]);

    const nameMap: Record<string, { name: string; image: string }> = {};
    (productNames || []).forEach(p => {
      nameMap[p.id] = { name: p.name, image: (p.image_url || "").split(",")[0].trim() };
    });

    const enrichedProducts = topProductsList.map(p => ({
      ...p,
      name: nameMap[p.product_id]?.name || p.product_id,
      image: nameMap[p.product_id]?.image || "",
    }));

    // Traffic sources
    const { data: allViews } = await supabaseClient
      .from("page_views")
      .select("referrer, utm_source, utm_medium, utm_campaign, country_code, page_path, created_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false })
      .limit(5000);

    // Source breakdown
    const sourceCounts: Record<string, number> = {};
    (allViews || []).forEach(v => {
      let source = "Direct";
      if (v.utm_source) source = v.utm_source;
      else if (v.referrer) {
        try {
          const url = new URL(v.referrer);
          source = url.hostname.replace("www.", "");
        } catch { source = v.referrer.slice(0, 50); }
      }
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    const sources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([source, count]) => ({ source, count }));

    // Country breakdown
    const countryCounts: Record<string, number> = {};
    (allViews || []).forEach(v => {
      const cc = v.country_code || "Unknown";
      countryCounts[cc] = (countryCounts[cc] || 0) + 1;
    });
    const countries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([country, count]) => ({ country, count }));

    // Daily views
    const dailyCounts: Record<string, number> = {};
    (allViews || []).forEach(v => {
      const day = v.created_at.slice(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });
    const dailyViews = Object.entries(dailyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // Top pages
    const pageCounts: Record<string, number> = {};
    (allViews || []).forEach(v => {
      pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([page, count]) => ({ page, count }));

    // Get blocked countries
    const { data: blockedCountries } = await supabaseClient
      .from("blocked_countries")
      .select("*")
      .order("country_name");

    return new Response(JSON.stringify({
      total_views: (allViews || []).length,
      top_products: enrichedProducts,
      sources,
      countries,
      daily_views: dailyViews,
      top_pages: topPages,
      blocked_countries: blockedCountries || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-analytics error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
