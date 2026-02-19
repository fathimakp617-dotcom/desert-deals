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

    const { batch_size = 50, offset = 0 } = await req.json().catch(() => ({}));

    // Step 1: List ALL files in the product-images bucket (flat + folders)
    const storageFiles = new Map<string, string>(); // filename -> public URL

    const listAllFiles = async (prefix = "") => {
      const { data, error } = await supabase.storage
        .from("product-images")
        .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });

      if (error || !data) return;

      for (const item of data) {
        const path = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null || item.metadata === null) {
          // It's a folder
          await listAllFiles(path);
        } else {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(path);
          storageFiles.set(item.name.toLowerCase(), urlData.publicUrl);
        }
      }
    };

    await listAllFiles();

    console.log(`Found ${storageFiles.size} files in storage`);

    // Step 2: Fetch products with broken URLs
    const { data: products, error: fetchError, count } = await supabase
      .from("products")
      .select("id, name, image_url", { count: "exact" })
      .like("image_url", "%desertsdeals.com%")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .range(offset, offset + batch_size - 1);

    if (fetchError) throw fetchError;

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ done: true, matched: 0, unmatched: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Match and update
    let matched = 0;
    let unmatched = 0;
    const results: { id: string; name: string; status: string; matchedFiles?: number; totalFiles?: number }[] = [];

    for (const product of products) {
      const urls = (product.image_url || "")
        .split(",")
        .map((u: string) => u.trim())
        .filter(Boolean);

      const newUrls: string[] = [];
      const seenFilenames = new Set<string>();

      for (const url of urls) {
        // Skip if already migrated
        if (url.includes(supabaseUrl)) {
          newUrls.push(url);
          continue;
        }

        // Extract filename from URL
        const filename = url.split("/").pop()?.split("?")[0]?.toLowerCase();
        if (!filename || seenFilenames.has(filename)) continue;
        seenFilenames.add(filename);

        // Look up in storage
        const storageUrl = storageFiles.get(filename);
        if (storageUrl) {
          newUrls.push(storageUrl);
        }
      }

      if (newUrls.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ image_url: newUrls.join(", ") })
          .eq("id", product.id);

        if (!updateError) {
          matched++;
          results.push({
            id: product.id,
            name: product.name,
            status: "matched",
            matchedFiles: newUrls.length,
            totalFiles: seenFilenames.size,
          });
        }
      } else {
        unmatched++;
        results.push({
          id: product.id,
          name: product.name,
          status: "no_match",
          matchedFiles: 0,
          totalFiles: seenFilenames.size,
        });
      }
    }

    const remaining = (count || 0) - products.length;

    return new Response(
      JSON.stringify({
        done: remaining <= 0,
        matched,
        unmatched,
        remaining: Math.max(0, remaining),
        processed: products.length,
        storageFileCount: storageFiles.size,
        next_offset: offset + batch_size,
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
