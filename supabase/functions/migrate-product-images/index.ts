import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batch_size = 5, offset = 0 } = await req.json().catch(() => ({}));

    // Fetch products with external image URLs
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, image_url")
      .like("image_url", "%desertsdeals.com%")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .range(offset, offset + batch_size - 1);

    if (fetchError) throw fetchError;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ done: true, message: "No more products to process", offset }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; status: string; newUrls?: number; errors?: string[] }[] = [];

    for (const product of products) {
      const urls = (product.image_url || "").split(",").map((u: string) => u.trim()).filter(Boolean);
      const newUrls: string[] = [];
      const errors: string[] = [];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];

        // Skip if already in our storage
        if (url.includes(supabaseUrl)) {
          newUrls.push(url);
          continue;
        }

        // Skip duplicates within same product
        const alreadyProcessed = newUrls.find((nu) => {
          const existingFilename = nu.split("/").pop();
          const currentFilename = url.split("/").pop();
          return existingFilename === currentFilename;
        });
        if (alreadyProcessed) {
          newUrls.push(alreadyProcessed);
          continue;
        }

        try {
          // Download image
          const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(15000),
          });

          if (!response.ok) {
            errors.push(`Failed to fetch ${url}: ${response.status}`);
            newUrls.push(url); // Keep original URL as fallback
            continue;
          }

          const contentType = response.headers.get("content-type") || "image/jpeg";
          const imageData = await response.arrayBuffer();

          // Determine file extension
          const originalFilename = url.split("/").pop()?.split("?")[0] || `image-${i}`;
          const ext = originalFilename.includes(".") ? originalFilename.split(".").pop() : "jpg";
          const filename = `${Date.now()}-${i}.${ext}`;
          const storagePath = `${product.id}/${filename}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(storagePath, imageData, {
              contentType,
              upsert: true,
            });

          if (uploadError) {
            errors.push(`Upload failed for ${url}: ${uploadError.message}`);
            newUrls.push(url);
            continue;
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(storagePath);

          newUrls.push(publicUrlData.publicUrl);
        } catch (e) {
          errors.push(`Error processing ${url}: ${e.message}`);
          newUrls.push(url); // Keep original
        }
      }

      // Update product with new URLs
      const { error: updateError } = await supabase
        .from("products")
        .update({ image_url: newUrls.join(", ") })
        .eq("id", product.id);

      results.push({
        id: product.id,
        status: updateError ? "update_failed" : "success",
        newUrls: newUrls.filter((u) => u.includes(supabaseUrl)).length,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return new Response(
      JSON.stringify({
        done: false,
        processed: results.length,
        next_offset: offset + batch_size,
        total_remaining_estimate: 866 - offset - batch_size,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
