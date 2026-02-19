import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const { action, category, admin_email, admin_token } = body;

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

    // Check admin role - env-based fallback
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

    // LIST
    if (action === "list") {
      const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ categories: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE
    if (action === "create") {
      if (!category?.value || !category?.label) {
        return new Response(
          JSON.stringify({ error: "Value and label are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: maxOrder } = await supabaseClient
        .from("categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (maxOrder?.sort_order ?? 0) + 1;

      const { data, error } = await supabaseClient
        .from("categories")
        .insert({
          value: category.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          label: category.label.trim(),
          is_active: category.is_active ?? true,
          sort_order: category.sort_order ?? nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ category: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE
    if (action === "update") {
      if (!category?.id) {
        return new Response(
          JSON.stringify({ error: "Category ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updates: Record<string, unknown> = {};
      if (category.label !== undefined) updates.label = category.label.trim();
      if (category.is_active !== undefined) updates.is_active = category.is_active;
      if (category.sort_order !== undefined) updates.sort_order = category.sort_order;

      const { data, error } = await supabaseClient
        .from("categories")
        .update(updates)
        .eq("id", category.id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ category: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE
    if (action === "delete") {
      if (!category?.id) {
        return new Response(
          JSON.stringify({ error: "Category ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseClient
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
