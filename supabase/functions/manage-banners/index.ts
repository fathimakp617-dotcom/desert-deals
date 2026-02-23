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
    const { action, email, token, banner } = body;

    // Validate admin session
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

    // Validate session token
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

    // Handle actions
    if (action === "list") {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("position")
        .order("sort_order");
      
      if (error) throw error;
      return new Response(JSON.stringify({ banners: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { data, error } = await supabase
        .from("banners")
        .insert({
          title: banner.title || "",
          image_url: banner.image_url,
          link_url: banner.link_url || "/shop",
          position: banner.position || "hero",
          sort_order: banner.sort_order || 0,
          is_active: banner.is_active !== false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return new Response(JSON.stringify({ banner: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { data, error } = await supabase
        .from("banners")
        .update({
          title: banner.title,
          image_url: banner.image_url,
          link_url: banner.link_url,
          position: banner.position,
          sort_order: banner.sort_order,
          is_active: banner.is_active,
        })
        .eq("id", banner.id)
        .select()
        .single();
      
      if (error) throw error;
      return new Response(JSON.stringify({ banner: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", banner.id);
      
      if (error) throw error;
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
