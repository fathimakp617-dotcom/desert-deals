import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Try to fetch an image from multiple sources:
 * 1. Original URL
 * 2. Wayback Machine CDN (if_/ prefix for raw files)
 * 3. Wayback Machine (im_/ prefix for images)
 */
async function fetchImageWithFallbacks(url: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const sources = [
    url,
    `https://web.archive.org/web/2025if_/${url}`,
    `https://web.archive.org/web/2im_/${url}`,
    `https://web.archive.org/web/2024if_/${url}`,
  ];

  for (const src of sources) {
    try {
      const response = await fetch(src, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(20000),
        redirect: "follow",
      });

      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") || "";
      // Make sure we got an actual image, not an HTML error page
      if (contentType.startsWith("text/html")) continue;
      if (!contentType.startsWith("image/")) {
        // Some servers don't set content-type properly, check first bytes
        const data = await response.arrayBuffer();
        const firstBytes = new Uint8Array(data.slice(0, 4));
        // Check for JPEG (FFD8), PNG (89504E47), WEBP (52494646), GIF (47494638)
        const isImage =
          (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8) ||
          (firstBytes[0] === 0x89 && firstBytes[1] === 0x50) ||
          (firstBytes[0] === 0x52 && firstBytes[1] === 0x49) ||
          (firstBytes[0] === 0x47 && firstBytes[1] === 0x49);
        if (isImage) {
          return { data, contentType: contentType || "image/jpeg" };
        }
        continue;
      }

      const data = await response.arrayBuffer();
      if (data.byteLength < 1000) continue; // Skip tiny/empty responses
      return { data, contentType };
    } catch {
      continue;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batch_size = 3, offset = 0 } = await req.json().catch(() => ({}));

    // Fetch products with external image URLs
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, name, image_url")
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

    const results: { id: string; name: string; status: string; migratedCount?: number; totalUrls?: number; errors?: string[] }[] = [];

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

        try {
          const result = await fetchImageWithFallbacks(url);

          if (!result) {
            errors.push(`All sources failed for: ${url.split("/").pop()}`);
            // Don't keep broken URL
            continue;
          }

          // Determine file extension
          const originalFilename = url.split("/").pop()?.split("?")[0] || `image-${i}`;
          const ext = originalFilename.includes(".") ? originalFilename.split(".").pop() : "jpg";
          const filename = `${Date.now()}-${i}.${ext}`;
          const storagePath = `${product.id}/${filename}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(storagePath, result.data, {
              contentType: result.contentType,
              upsert: true,
            });

          if (uploadError) {
            errors.push(`Upload failed: ${uploadError.message}`);
            continue;
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(storagePath);

          newUrls.push(publicUrlData.publicUrl);
          console.log(`✅ Migrated image ${i + 1}/${urls.length} for ${product.name}`);
        } catch (e) {
          errors.push(`Error: ${e.message}`);
        }
      }

      // Update product - only if we have at least one URL
      if (newUrls.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ image_url: newUrls.join(", ") })
          .eq("id", product.id);

        results.push({
          id: product.id,
          name: product.name,
          status: updateError ? "update_failed" : "success",
          migratedCount: newUrls.filter((u) => u.includes(supabaseUrl)).length,
          totalUrls: urls.length,
          errors: errors.length > 0 ? errors : undefined,
        });
      } else {
        // No images recovered at all - leave original URLs
        results.push({
          id: product.id,
          name: product.name,
          status: "all_failed",
          migratedCount: 0,
          totalUrls: urls.length,
          errors,
        });
      }
    }

    // Count remaining
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .like("image_url", "%desertsdeals.com%")
      .eq("is_active", true);

    return new Response(
      JSON.stringify({
        done: false,
        processed: results.length,
        next_offset: offset + batch_size,
        remaining: count || 0,
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
