import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SITE_URL = "https://desertsdeals.com";

const BATCH_SIZE = 500;

async function fetchAllProducts(supabase: any) {
  const allProducts: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, stock_quantity, category, image_url")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, from + BATCH_SIZE - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allProducts.push(...data);
      from += BATCH_SIZE;
      hasMore = data.length === BATCH_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allProducts;
}

function escapeXml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeCsv(str: string): string {
  return (str || "").replace(/"/g, '""');
}

function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return "";
  const first = imageUrl.split(",")[0].trim();
  return first.startsWith("http") ? first : `${SITE_URL}${first}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const products = await fetchAllProducts(supabase);

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "xml";

    if (format === "csv") {
      const header = "id,title,description,availability,condition,price,link,image_link,brand,google_product_category\n";
      const rows = products.map((p: any) => {
        const imageUrl = getImageUrl(p.image_url);
        const availability = (p.stock_quantity || 0) > 0 ? "in stock" : "out of stock";
        const price = `${p.price} AED`;
        const title = escapeCsv(p.name);
        const desc = escapeCsv(p.description).substring(0, 500);
        const brand = escapeCsv(p.category || "Desert Deal");

        return `"${p.id}","${title}","${desc}","${availability}","new","${price}","${SITE_URL}/product/${p.id}","${imageUrl}","${brand}","Apparel & Accessories > Shoes"`;
      }).join("\n");

      return new Response(header + rows, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "inline; filename=product-feed.csv",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Default: RSS/XML feed for Meta
    const items = products.map((p: any) => {
      const imageUrl = getImageUrl(p.image_url);
      const availability = (p.stock_quantity || 0) > 0 ? "in stock" : "out of stock";
      const brand = escapeXml(p.category || "Desert Deal");
      const desc = escapeXml(p.description).substring(0, 500);
      const title = escapeXml(p.name);

      return `    <item>
      <g:id>${p.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${SITE_URL}/product/${p.id}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${p.price} AED</g:price>
      <g:google_product_category>Apparel &amp; Accessories &gt; Shoes</g:google_product_category>
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Desert Deal - Product Feed</title>
    <link>${SITE_URL}</link>
    <description>Premium shoes and accessories from Desert Deal UAE</description>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Feed error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
