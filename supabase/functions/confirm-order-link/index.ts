import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("token") ?? "";
    let action = url.searchParams.get("action") ?? "confirm";

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      token = String(body.token ?? token);
      action = String(body.action ?? action);
    }

    if (!UUID_RE.test(token)) {
      return json({ error: "Invalid confirmation link" }, 400);
    }
    if (action !== "confirm" && action !== "cancel") {
      return json({ error: "Invalid action" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, order_status, customer_name, total")
      .eq("id", token)
      .maybeSingle();

    if (error) throw error;
    if (!order) return json({ error: "Order not found" }, 404);

    const locked = ["shipped", "delivered", "cancelled", "returned"];
    if (locked.includes(String(order.order_status).toLowerCase())) {
      return json({
        already: true,
        status: order.order_status,
        order_number: order.order_number,
        customer_name: order.customer_name,
        total: order.total,
      });
    }

    const nextStatus = action === "confirm" ? "confirmed" : "cancelled";

    if (String(order.order_status).toLowerCase() === nextStatus) {
      return json({
        already: true,
        status: order.order_status,
        order_number: order.order_number,
        customer_name: order.customer_name,
        total: order.total,
      });
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ order_status: nextStatus })
      .eq("id", order.id);

    if (updateError) throw updateError;

    await supabase.from("activity_logs").insert({
      actor_email: "customer",
      actor_role: "customer",
      action_type: action === "confirm" ? "order_confirmed_by_customer" : "order_cancelled_by_customer",
      action_details: { via: "whatsapp_link" },
      order_id: order.id,
      order_number: order.order_number,
    });

    return json({
      success: true,
      status: nextStatus,
      order_number: order.order_number,
      customer_name: order.customer_name,
      total: order.total,
    });
  } catch (e) {
    console.error("confirm-order-link error:", e);
    return json({ error: "Something went wrong" }, 500);
  }
});
