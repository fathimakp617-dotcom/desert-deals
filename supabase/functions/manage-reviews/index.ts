import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Validate admin session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionToken = authHeader.replace("Bearer ", "");
    const { data: session, error: sessionError } = await supabaseClient
      .from("staff_sessions")
      .select("email, expires_at")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if admin
    const adminEmails = (Deno.env.get("ADMIN_EMAILS") || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
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

    const body = await req.json();
    const { action, reviewId, isApproved } = body;

    switch (action) {
      case "update_status": {
        const { data: updatedReview, error } = await supabaseClient
          .from("product_reviews")
          .update({ is_approved: isApproved })
          .eq("id", reviewId)
          .select()
          .single();

        if (error) throw error;

        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: isApproved ? "review_approved" : "review_hidden",
          action_details: { review_id: reviewId },
        });

        return new Response(JSON.stringify({ review: updatedReview }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { error } = await supabaseClient
          .from("product_reviews")
          .delete()
          .eq("id", reviewId);

        if (error) throw error;

        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: "review_deleted",
          action_details: { review_id: reviewId },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "bulk_import": {
        const { reviews: importReviews, product_id } = body;
        if (!importReviews || !Array.isArray(importReviews) || !product_id) {
          return new Response(JSON.stringify({ error: "Missing reviews array or product_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let inserted = 0;
        let failed = 0;
        const batchSize = 50;

        for (let i = 0; i < importReviews.length; i += batchSize) {
          const batch = importReviews.slice(i, i + batchSize).map((r: any) => ({
            product_id,
            customer_name: (r.customer_name || r.name || "Verified Buyer").trim(),
            customer_email: (r.customer_email || r.email || `review-${Date.now()}-${Math.random().toString(36).slice(2)}@imported.local`).trim(),
            rating: Math.min(5, Math.max(1, parseInt(r.rating) || 5)),
            title: (r.title || "").trim() || null,
            comment: (r.comment || r.review || r.body || "").trim() || null,
            is_approved: true,
            is_verified_purchase: r.is_verified_purchase === true || r.verified === true || r.verified_purchase === true || false,
            photos: Array.isArray(r.photos) ? r.photos.filter(Boolean) : (r.photo || r.image || r.photos ? [r.photo || r.image || r.photos].filter(Boolean) : []),
            created_at: r.created_at || r.date || new Date().toISOString(),
          }));

          const { error: insertError, data: insertedData } = await supabaseClient
            .from("product_reviews")
            .insert(batch)
            .select("id");

          if (insertError) {
            console.error("Batch insert error:", insertError);
            failed += batch.length;
          } else {
            inserted += (insertedData?.length || 0);
          }
        }

        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: "reviews_bulk_imported",
          action_details: { product_id, total: importReviews.length, inserted, failed },
        });

        return new Response(JSON.stringify({ success: true, inserted, failed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("Error in manage-reviews:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
