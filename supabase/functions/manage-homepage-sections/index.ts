import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    const adminEmails = adminEmailsRaw.split(",").map((e: string) => e.trim().toLowerCase()).filter((e: string) => e);

    const body = await req.json();
    const { action, email, token, section, updates } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!email || !token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!adminEmails.includes(normalizedEmail)) {
      return new Response(JSON.stringify({ error: "Not an admin" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: session } = await supabase
      .from("staff_sessions")
      .select("id, expires_at")
      .eq("email", normalizedEmail)
      .eq("session_token", token)
      .maybeSingle();

    if (!session || new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return new Response(JSON.stringify({ sections: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { data, error } = await supabase
        .from("homepage_sections")
        .update({
          title: section.title,
          subtitle: section.subtitle,
          is_visible: section.is_visible,
          sort_order: section.sort_order,
          config: section.config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ section: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { data, error } = await supabase
        .from("homepage_sections")
        .insert({
          section_key: section.section_key,
          title: section.title || "",
          subtitle: section.subtitle || "",
          is_visible: section.is_visible !== false,
          sort_order: section.sort_order || 0,
          section_type: section.section_type || "custom",
          config: section.config || {},
        })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ section: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("homepage_sections")
        .delete()
        .eq("id", section.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reorder") {
      if (!Array.isArray(updates)) {
        return new Response(JSON.stringify({ error: "updates array required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      for (const item of updates) {
        const { error } = await supabase
          .from("homepage_sections")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);
        if (error) throw error;
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
