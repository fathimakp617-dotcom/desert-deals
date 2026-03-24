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

    // ===== PAGE VIEWS =====
    const { data: allViews } = await supabaseClient
      .from("page_views")
      .select("referrer, utm_source, utm_medium, utm_campaign, country_code, page_path, created_at, session_id, product_id")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false })
      .limit(5000);

    // ===== LIVE VISITORS (last 5 min) =====
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: liveViews } = await supabaseClient
      .from("page_views")
      .select("session_id")
      .gte("created_at", fiveMinAgo);

    const liveSessionIds = new Set((liveViews || []).map(v => v.session_id).filter(Boolean));
    const live_visitors = liveSessionIds.size;

    // ===== LIVE CARTS (cart_active events in last 5 min) =====
    const { data: liveCartEvents } = await supabaseClient
      .from("analytics_events")
      .select("session_id")
      .eq("event_type", "cart_active")
      .gte("created_at", fiveMinAgo);

    const liveCartSessions = new Set((liveCartEvents || []).map(e => e.session_id).filter(Boolean));
    const live_carts = liveCartSessions.size;

    // ===== ORDERS (for sales metrics) =====
    const { data: orders } = await supabaseClient
      .from("orders")
      .select("id, total, order_status, created_at, items, customer_email")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false });

    const activeOrders = (orders || []).filter(o => o.order_status !== "cancelled");
    const total_sales = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const total_orders = activeOrders.length;
    const average_order_value = total_orders > 0 ? total_sales / total_orders : 0;

    // ===== UNIQUE SESSIONS =====
    const uniqueSessions = new Set((allViews || []).map(v => v.session_id).filter(Boolean));
    const total_sessions = uniqueSessions.size || (allViews || []).length;

    // ===== CONVERSION RATE =====
    // Sessions that resulted in an order
    const conversion_rate = total_sessions > 0 ? (total_orders / total_sessions) * 100 : 0;

    // ===== ADD TO CART EVENTS =====
    const { data: addToCartEvents } = await supabaseClient
      .from("analytics_events")
      .select("session_id")
      .eq("event_type", "add_to_cart")
      .gte("created_at", from)
      .lte("created_at", to);

    const addToCartSessions = new Set((addToCartEvents || []).map(e => e.session_id).filter(Boolean));
    const add_to_cart_count = addToCartSessions.size;
    const add_to_cart_rate = total_sessions > 0 ? (add_to_cart_count / total_sessions) * 100 : 0;

    // ===== CHECKOUT EVENTS =====
    const { data: checkoutEvents } = await supabaseClient
      .from("analytics_events")
      .select("session_id")
      .eq("event_type", "checkout_started")
      .gte("created_at", from)
      .lte("created_at", to);

    const checkoutSessions = new Set((checkoutEvents || []).map(e => e.session_id).filter(Boolean));
    const checkout_count = checkoutSessions.size;

    // ===== RETURNING CUSTOMERS =====
    const { data: allOrdersForReturning } = await supabaseClient
      .from("orders")
      .select("customer_email")
      .lt("created_at", from)
      .limit(5000);

    const previousEmails = new Set((allOrdersForReturning || []).map(o => o.customer_email?.toLowerCase()).filter(Boolean));
    const periodEmails = activeOrders.map(o => o.customer_email?.toLowerCase()).filter(Boolean);
    const returningCount = periodEmails.filter(e => previousEmails.has(e)).length;
    const returning_customer_rate = periodEmails.length > 0 ? (returningCount / periodEmails.length) * 100 : 0;

    // ===== TOP PRODUCTS BY VIEWS =====
    const productCounts: Record<string, number> = {};
    (allViews || []).forEach(v => {
      if (v.product_id) productCounts[v.product_id] = (productCounts[v.product_id] || 0) + 1;
    });
    const topProductsList = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, views]) => ({ product_id: id, views }));

    const productIds = topProductsList.map(p => p.product_id);
    const { data: productNames } = await supabaseClient
      .from("products")
      .select("id, name, image_url, price")
      .in("id", productIds.length ? productIds : ["__none__"]);

    const nameMap: Record<string, { name: string; image: string; price: number }> = {};
    (productNames || []).forEach(p => {
      nameMap[p.id] = { name: p.name, image: (p.image_url || "").split(",")[0].trim(), price: p.price };
    });

    // Calculate units sold per product
    const unitsSold: Record<string, number> = {};
    activeOrders.forEach(o => {
      const items = o.items as any[];
      if (Array.isArray(items)) {
        items.forEach(item => {
          const pid = item.productId || item.product_id;
          if (pid) unitsSold[pid] = (unitsSold[pid] || 0) + (item.quantity || 1);
        });
      }
    });

    const enrichedProducts = topProductsList.map(p => ({
      ...p,
      name: nameMap[p.product_id]?.name || p.product_id,
      image: nameMap[p.product_id]?.image || "",
      price: nameMap[p.product_id]?.price || 0,
      units_sold: unitsSold[p.product_id] || 0,
    }));

    // ===== TOP PRODUCTS BY SALES =====
    const topBySales = Object.entries(unitsSold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, units]) => {
        const info = nameMap[id];
        return {
          product_id: id,
          name: info?.name || id,
          image: info?.image || "",
          price: info?.price || 0,
          units_sold: units,
        };
      });

    // Enrich top by sales if product info not in nameMap
    const missingIds = topBySales.filter(p => !nameMap[p.product_id]).map(p => p.product_id);
    if (missingIds.length > 0) {
      const { data: missingProducts } = await supabaseClient
        .from("products")
        .select("id, name, image_url, price")
        .in("id", missingIds);
      (missingProducts || []).forEach(p => {
        const found = topBySales.find(x => x.product_id === p.id);
        if (found) {
          found.name = p.name;
          found.image = (p.image_url || "").split(",")[0].trim();
          found.price = p.price;
        }
      });
    }

    // ===== TRAFFIC SOURCES =====
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

    // ===== COUNTRY BREAKDOWN =====
    const countryCounts: Record<string, number> = {};
    (allViews || []).forEach(v => {
      const cc = v.country_code || "Unknown";
      countryCounts[cc] = (countryCounts[cc] || 0) + 1;
    });
    const countries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([country, count]) => ({ country, count }));

    // ===== DAILY VIEWS =====
    const dailyCounts: Record<string, number> = {};
    (allViews || []).forEach(v => {
      const day = v.created_at.slice(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });
    const daily_views = Object.entries(dailyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // ===== DAILY SALES =====
    const dailySales: Record<string, { revenue: number; orders: number }> = {};
    activeOrders.forEach(o => {
      const day = o.created_at.slice(0, 10);
      if (!dailySales[day]) dailySales[day] = { revenue: 0, orders: 0 };
      dailySales[day].revenue += o.total || 0;
      dailySales[day].orders += 1;
    });
    const daily_sales = Object.entries(dailySales)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    // ===== TOP PAGES =====
    const pageCounts: Record<string, number> = {};
    (allViews || []).forEach(v => {
      pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
    });
    const top_pages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([page, count]) => ({ page, count }));

    // ===== BLOCKED COUNTRIES =====
    const { data: blockedCountries } = await supabaseClient
      .from("blocked_countries")
      .select("*")
      .order("country_name");

    return new Response(JSON.stringify({
      // Live
      live_visitors,
      live_carts,
      // Sales metrics
      total_sales,
      total_orders,
      average_order_value,
      conversion_rate,
      add_to_cart_rate,
      add_to_cart_count,
      checkout_count,
      returning_customer_rate,
      // Sessions
      total_sessions,
      total_views: (allViews || []).length,
      // Products
      top_products: enrichedProducts,
      top_products_by_sales: topBySales,
      // Traffic
      sources,
      countries,
      // Time series
      daily_views,
      daily_sales,
      // Pages
      top_pages,
      // Geo blocking
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
