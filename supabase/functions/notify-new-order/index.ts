import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { order_id } = await req.json().catch(() => ({}));
    if (typeof order_id !== "string" || !/^[0-9a-f-]{36}$/i.test(order_id)) return json({ error: "order_id required" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, total, payment_method, created_at")
      .eq("id", order_id)
      .maybeSingle();
    if (!order) return json({ error: "Order not found" }, 404);
    // Only notify for fresh orders (prevents replay spam)
    if (Date.now() - new Date(order.created_at).getTime() > 10 * 60 * 1000) return json({ skipped: "old order" });

    const { data: devices } = await supabase.from("admin_devices").select("push_token");
    const tokens = (devices || []).map((d) => d.push_token).filter((t) => t?.startsWith("ExponentPushToken") || t?.startsWith("ExpoPushToken"));
    if (!tokens.length) return json({ sent: 0 });

    const pay = order.payment_method === "cod" ? "COD" : "Online";
    const messages = tokens.map((to) => ({
      to,
      title: `🚨 New Order ${order.order_number}`,
      body: `${order.customer_name} placed an order for ${Number(order.total).toLocaleString()} AED (${pay})`,
      sound: "default",
      priority: "high",
      channelId: "orders",
      data: { order_id: order.id, order_number: order.order_number },
    }));

    const results = [];
    for (let i = 0; i < messages.length; i += 100) {
      const r = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
      const body = await r.json().catch(() => ({}));
      results.push(body);
      // Remove tokens Expo reports as unregistered
      const tickets = body?.data || [];
      const bad = tickets
        .map((t: any, idx: number) => (t?.details?.error === "DeviceNotRegistered" ? messages[i + idx].to : null))
        .filter(Boolean);
      if (bad.length) await supabase.from("admin_devices").delete().in("push_token", bad);
    }
    console.log(`Push sent for ${order.order_number} to ${tokens.length} device(s)`);
    return json({ sent: tokens.length });
  } catch (e) {
    console.error("notify-new-order error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
