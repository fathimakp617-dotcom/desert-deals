import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { admin_email, admin_token, page = 1, limit = 50, search, status_filter, type_filter } = body;

    if (!admin_email || !admin_token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Validate admin session
    const { data: session } = await supabaseClient
      .from("staff_sessions")
      .select("email")
      .eq("session_token", admin_token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let query = supabaseClient
      .from("email_logs")
      .select("*", { count: "exact" })
      .order("sent_at", { ascending: false });

    if (search) {
      query = query.or(`recipient_email.ilike.%${search}%,order_number.ilike.%${search}%,subject.ilike.%${search}%`);
    }
    if (status_filter && status_filter !== "all") {
      query = query.eq("status", status_filter);
    }
    if (type_filter && type_filter !== "all") {
      query = query.eq("email_type", type_filter);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(JSON.stringify({ logs: data, total: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
