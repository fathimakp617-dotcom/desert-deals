import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const b = await req.json().catch(() => ({}));
    const email = String(b.admin_email || "").trim().toLowerCase();
    const token = String(b.admin_token || "");
    const pushToken = String(b.push_token || "").trim();
    const platform = b.platform ? String(b.platform).slice(0, 20) : null;
    const deviceName = b.device_name ? String(b.device_name).slice(0, 100) : null;
    if (!email || !token || !pushToken || pushToken.length > 300) return json({ error: "admin_email, admin_token and push_token required" }, 400);

    const allowed = [Deno.env.get("ADMIN_EMAILS") || "", Deno.env.get("SHIPPING_EMAILS") || ""]
      .join(",").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!allowed.includes(email)) return json({ error: "Access denied" }, 403);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: session } = await supabase
      .from("staff_sessions").select("expires_at")
      .eq("email", email).eq("session_token", token).maybeSingle();
    if (!session || new Date(session.expires_at) < new Date()) return json({ error: "Session expired. Please log in again." }, 401);

    const { error } = await supabase.from("admin_devices").upsert(
      { email, push_token: pushToken, platform, device_name: deviceName, updated_at: new Date().toISOString() },
      { onConflict: "push_token" },
    );
    if (error) throw error;
    return json({ success: true });
  } catch (e) {
    console.error("register-admin-device error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
