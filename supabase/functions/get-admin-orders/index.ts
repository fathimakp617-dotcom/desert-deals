import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const QUERY_TIMEOUT_MS = 6000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs = QUERY_TIMEOUT_MS): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Query timeout")), timeoutMs) as unknown as number;
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Validate session token from database
async function validateSession(supabase: any, email: string, token: string): Promise<boolean> {
  if (!email || !token) return false;

  const { data: session } = await withTimeout(
    supabase
      .from("staff_sessions")
      .select("id, expires_at")
      .eq("email", email.toLowerCase())
      .eq("session_token", token)
      .maybeSingle()
  );

  if (!session) return false;

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    await withTimeout(supabase.from("staff_sessions").delete().eq("id", session.id));
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    const shippingEmailsRaw = Deno.env.get("SHIPPING_EMAILS") || "";
    const adminEmails = adminEmailsRaw.split(",").map((e) => e.trim().toLowerCase()).filter((e) => e);
    const shippingEmails = shippingEmailsRaw.split(",").map((e) => e.trim().toLowerCase()).filter((e) => e);
    const allowedEmails = [...adminEmails, ...shippingEmails];

    // Get admin credentials from request body
    const body = await req.json().catch(() => ({}));
    const adminEmail = body.admin_email;
    const adminToken = body.admin_token;

    const cursorCreatedAt = typeof body.cursor_created_at === "string" ? body.cursor_created_at : null;

    const page = Math.max(1, Number(body.page ?? 1));
    const pageSizeRaw = Number(body.page_size ?? 200);
    const pageSize = Math.min(500, Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 200));

    if (!adminEmail || !adminToken) {
      console.log("Missing credentials in body");
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify email is in allowed list (admin or shipping)
    if (!allowedEmails.includes(adminEmail.toLowerCase())) {
      console.log(`Email not in allowed list: ${adminEmail}`);
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session token
    if (!(await validateSession(supabase, adminEmail, adminToken))) {
      console.log(`Invalid or expired session for: ${adminEmail}`);
      return new Response(JSON.stringify({ error: "Session expired. Please log in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let safeOrders: any[] = [];
    let nextCursor: string | null = null;

    // Preferred strategy: created_at ordered (supports cursor pagination).
    try {
      let orderedQuery = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (cursorCreatedAt) {
        orderedQuery = orderedQuery.lt("created_at", cursorCreatedAt).limit(pageSize);
      } else {
        orderedQuery = orderedQuery.range(from, to);
      }

      const { data: orderedOrders, error: orderedError } = await withTimeout(orderedQuery, 4500);
      if (orderedError) throw orderedError;

      safeOrders = orderedOrders || [];
      nextCursor = safeOrders.length === pageSize ? safeOrders[safeOrders.length - 1]?.created_at ?? null : null;
    } catch (orderedErr) {
      // Fallback strategy: offset query without ORDER BY (faster on unindexed/large tables).
      console.warn("Ordered query timed out, using fallback pagination", orderedErr);

      const { data: fallbackOrders, error: fallbackError } = await withTimeout(
        supabase.from("orders").select("*").range(from, to),
        QUERY_TIMEOUT_MS
      );

      if (fallbackError) throw fallbackError;

      safeOrders = (fallbackOrders || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      nextCursor = null;
    }

    const hasMore = safeOrders.length === pageSize;

    return new Response(
      JSON.stringify({
        orders: safeOrders,
        page,
        page_size: pageSize,
        has_more: hasMore,
        next_cursor: nextCursor,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});