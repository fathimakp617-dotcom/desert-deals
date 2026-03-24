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

    // ===== Single DB call for all page view aggregations =====
    const [aggregatesRes, ordersRes, returningOrdersRes, blockedCountriesRes] = await Promise.all([
      supabaseClient.rpc("get_analytics_aggregates", { p_from: from, p_to: to }).single(),
      supabaseClient
        .from("orders")
        .select("id, total, order_status, created_at, items, customer_email")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false }),
      supabaseClient
        .from("orders")
        .select("customer_email")
        .lt("created_at", from)
        .limit(5000),
      supabaseClient
        .from("blocked_countries")
        .select("*")
        .order("country_name"),
    ]);

    const rawAgg = aggregatesRes.data;
    const agg = typeof rawAgg === "string" ? JSON.parse(rawAgg) : rawAgg || {};
    const total_views = Number(agg.total_views || 0);
    const total_sessions = Number(agg.unique_sessions || 0) || total_views;
    const live_visitors = Number(agg.live_visitors || 0);
    const live_carts = Number(agg.live_carts || 0);
    const add_to_cart_count = Number(agg.atc_sessions || 0);
    const checkout_count = Number(agg.checkout_sessions || 0);

    // ===== Orders =====
    const orders = ordersRes.data || [];
    const activeOrders = orders.filter((o: any) => o.order_status !== "cancelled");
    const total_sales = activeOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const total_orders = activeOrders.length;
    const average_order_value = total_orders > 0 ? total_sales / total_orders : 0;

    // ===== Conversion rates =====
    const conversion_rate = total_sessions > 0 ? (total_orders / total_sessions) * 100 : 0;
    const add_to_cart_rate = total_sessions > 0 ? (add_to_cart_count / total_sessions) * 100 : 0;

    // ===== Returning customers =====
    const previousEmails = new Set((returningOrdersRes.data || []).map((o: any) => o.customer_email?.toLowerCase()).filter(Boolean));
    const periodEmails = activeOrders.map((o: any) => o.customer_email?.toLowerCase()).filter(Boolean);
    const returningCount = periodEmails.filter((e: string) => previousEmails.has(e)).length;
    const returning_customer_rate = periodEmails.length > 0 ? (returningCount / periodEmails.length) * 100 : 0;

    // ===== Daily views =====
    const daily_views = (agg.daily_views || []).map((r: any) => ({ date: r.day, count: Number(r.view_count) }));

    // ===== Top pages =====
    const top_pages = (agg.top_pages || []).map((r: any) => ({ page: r.page, count: Number(r.view_count) }));

    // ===== Traffic sources =====
    const sources = (agg.sources || []).map((r: any) => ({ source: r.source, count: Number(r.view_count) }));

    // ===== Countries =====
    const countries = (agg.countries || []).map((r: any) => ({ country: r.country, count: Number(r.view_count) }));

    // ===== Top products by views =====
    const topProductViewsList = (agg.top_product_views || []).map((r: any) => ({
      product_id: r.pid,
      views: Number(r.view_count),
    }));

    // Enrich with product names
    const productIds = topProductViewsList.map((p: any) => p.product_id);
    const { data: productNames } = await supabaseClient
      .from("products")
      .select("id, name, image_url, price")
      .in("id", productIds.length ? productIds : ["__none__"]);

    const nameMap: Record<string, { name: string; image: string; price: number }> = {};
    (productNames || []).forEach((p: any) => {
      nameMap[p.id] = { name: p.name, image: (p.image_url || "").split(",")[0].trim(), price: p.price };
    });

    // Units sold per product
    const unitsSold: Record<string, number> = {};
    activeOrders.forEach((o: any) => {
      const items = o.items as any[];
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const pid = item.productId || item.product_id;
          if (pid) unitsSold[pid] = (unitsSold[pid] || 0) + (item.quantity || 1);
        });
      }
    });

    const top_products = topProductViewsList.map((p: any) => ({
      ...p,
      name: nameMap[p.product_id]?.name || p.product_id,
      image: nameMap[p.product_id]?.image || "",
      price: nameMap[p.product_id]?.price || 0,
      units_sold: unitsSold[p.product_id] || 0,
    }));

    // Top products by sales
    const topBySales = Object.entries(unitsSold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, units]) => ({
        product_id: id,
        name: nameMap[id]?.name || id,
        image: nameMap[id]?.image || "",
        price: nameMap[id]?.price || 0,
        units_sold: units,
      }));

    // Enrich missing product info for top by sales
    const missingIds = topBySales.filter(p => !nameMap[p.product_id]).map(p => p.product_id);
    if (missingIds.length > 0) {
      const { data: missingProducts } = await supabaseClient
        .from("products")
        .select("id, name, image_url, price")
        .in("id", missingIds);
      (missingProducts || []).forEach((p: any) => {
        const found = topBySales.find(x => x.product_id === p.id);
        if (found) {
          found.name = p.name;
          found.image = (p.image_url || "").split(",")[0].trim();
          found.price = p.price;
        }
      });
    }

    // ===== Daily sales =====
    const dailySales: Record<string, { revenue: number; orders: number }> = {};
    activeOrders.forEach((o: any) => {
      const day = o.created_at.slice(0, 10);
      if (!dailySales[day]) dailySales[day] = { revenue: 0, orders: 0 };
      dailySales[day].revenue += o.total || 0;
      dailySales[day].orders += 1;
    });
    const daily_sales = Object.entries(dailySales)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    return new Response(JSON.stringify({
      live_visitors,
      live_carts,
      total_sales,
      total_orders,
      average_order_value,
      conversion_rate,
      add_to_cart_rate,
      add_to_cart_count,
      checkout_count,
      returning_customer_rate,
      total_sessions,
      total_views,
      top_products,
      top_products_by_sales: topBySales,
      sources,
      countries,
      daily_views,
      daily_sales,
      top_pages,
      blocked_countries: blockedCountriesRes.data || [],
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
