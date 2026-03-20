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
    const url = new URL(req.url);
    const productId = url.searchParams.get("id");

    if (!productId) {
      return Response.redirect("https://desertsdeals.com/shop", 302);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: product } = await supabase
      .from("products")
      .select("id, name, description, price, original_price, discount_percent, category, image_url")
      .eq("id", productId)
      .single();

    if (!product) {
      return Response.redirect("https://desertsdeals.com/shop", 302);
    }

    const productUrl = `https://desertsdeals.com/product/${product.id}`;
    const imageUrl = product.image_url ? product.image_url.split(",")[0].trim() : "";
    const price = Math.round(product.price);
    const originalPrice = product.original_price ? Math.round(product.original_price) : null;
    const discount = product.discount_percent || 0;
    const category = product.category || "Premium";
    const description = (product.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().substring(0, 200);

    const priceText = originalPrice && discount > 0
      ? `AED ${price} (was AED ${originalPrice} - ${discount}% OFF)`
      : `AED ${price}`;

    const ogDescription = `${priceText} | ${description || `Shop ${category} at Desert Deals`}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(product.name)} | Desert Deals</title>
  <meta name="description" content="${escapeAttr(ogDescription)}" />

  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escapeAttr(product.name)} - ${escapeAttr(category)}" />
  <meta property="og:description" content="${escapeAttr(ogDescription)}" />
  <meta property="og:url" content="${productUrl}" />
  <meta property="og:image" content="${escapeAttr(imageUrl)}" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="800" />
  <meta property="og:site_name" content="Desert Deals" />

  <meta property="product:price:amount" content="${price}" />
  <meta property="product:price:currency" content="AED" />
  <meta property="product:brand" content="${escapeAttr(category)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeAttr(product.name)}" />
  <meta name="twitter:description" content="${escapeAttr(ogDescription)}" />
  <meta name="twitter:image" content="${escapeAttr(imageUrl)}" />

  <meta http-equiv="refresh" content="0;url=${productUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${productUrl}">${escapeHtml(product.name)}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("OG proxy error:", error);
    return Response.redirect("https://desertsdeals.com/shop", 302);
  }
});

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
