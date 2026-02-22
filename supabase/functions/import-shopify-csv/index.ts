import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 2000);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(/["'""'']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

function detectCategory(title: string, fileCategory: string): string {
  const t = title.toLowerCase();
  const brandMap: [string[], string][] = [
    [["nike", "air max", "air force", "dunk", "flyknit", "vapormax", "react infinity"], "Nike"],
    [["jordan", "air jordan"], "Jordan"],
    [["adidas", "yeezy", "ultraboost"], "Adidas"],
    [["new balance"], "New Balance"],
    [["on cloud", "cloudmonster"], "On Cloud"],
    [["asics", "gel-"], "Asics"],
    [["hoka", "bondi", "clifton"], "Hoka"],
    [["puma"], "Puma"],
    [["louis vuitton", "lv "], "Louis Vuitton"],
    [["gucci"], "Gucci"],
    [["dior"], "Dior"],
    [["hermes", "hermès"], "Hermes"],
    [["rolex"], "Rolex"],
    [["cartier"], "Cartier"],
    [["tom ford"], "Tom Ford"],
    [["christian louboutin", "louboutin"], "Christian Louboutin"],
    [["chanel"], "Chanel"],
    [["goyard"], "Goyard"],
    [["onitsuka"], "Onitsuka Tiger"],
    [["loro piana"], "Loro Piana"],
    [["versace"], "Versace"],
    [["balenciaga"], "Balenciaga"],
    [["prada"], "Prada"],
    [["omega"], "Watches"],
    [["audemars", "ap royal"], "Watches"],
    [["patek"], "Watches"],
    [["richard mille"], "Watches"],
    [["tag heuer"], "Watches"],
    [["hublot"], "Watches"],
  ];
  for (const [keywords, brand] of brandMap) {
    for (const kw of keywords) {
      if (t.includes(kw)) return brand;
    }
  }
  return fileCategory;
}

/** Lightweight line-based CSV parser for Shopify format - processes line by line to save memory */
function parseShopifyCSV(text: string): Map<string, {
  handle: string; title: string; description: string;
  price: number; compareAt: number; images: string[];
  sizes: string[]; status: string;
}> {
  const products = new Map<string, {
    handle: string; title: string; description: string;
    price: number; compareAt: number; images: string[];
    sizes: string[]; status: string;
  }>();

  // Simple field extraction - handle quoted fields
  const splitRow = (line: string): string[] => {
    const fields: string[] = [];
    let i = 0;
    while (i <= line.length) {
      let val = "";
      if (i < line.length && line[i] === '"') {
        i++;
        while (i < line.length) {
          if (line[i] === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
              val += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            val += line[i];
            i++;
          }
        }
      } else {
        while (i < line.length && line[i] !== ",") {
          val += line[i];
          i++;
        }
      }
      fields.push(val);
      if (i < line.length && line[i] === ",") i++;
      else break;
    }
    return fields;
  };

  // Split into lines handling quoted newlines
  const lines: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQuote = !inQuote;
    if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (current.trim()) lines.push(current);
      current = "";
      if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return products;

  const headers = splitRow(lines[0]);
  const colIdx: Record<string, number> = {};
  headers.forEach((h, i) => { colIdx[h.trim()] = i; });
  const col = (fields: string[], name: string): string => {
    const idx = colIdx[name];
    return idx !== undefined && idx < fields.length ? fields[idx].trim() : "";
  };

  for (let r = 1; r < lines.length; r++) {
    const fields = splitRow(lines[r]);
    const handle = col(fields, "Handle");
    if (!handle) continue;

    const title = col(fields, "Title");
    const imageUrl = col(fields, "Image Src");
    const price = parseFloat(col(fields, "Variant Price")) || 0;
    const compareAt = parseFloat(col(fields, "Variant Compare At Price")) || 0;
    const status = col(fields, "Status");
    const opt1Val = col(fields, "Option1 Value");

    if (!products.has(handle)) {
      products.set(handle, {
        handle,
        title: title || handle,
        description: stripHtml(col(fields, "Body (HTML)")),
        price,
        compareAt,
        images: [],
        sizes: [],
        status: status || "active",
      });
    }

    const p = products.get(handle)!;
    if (title && p.title === handle) p.title = title;
    const desc = stripHtml(col(fields, "Body (HTML)"));
    if (desc && !p.description) p.description = desc;
    if (imageUrl && !p.images.includes(imageUrl)) p.images.push(imageUrl);
    if (opt1Val && opt1Val !== "Default Title" && !p.sizes.includes(opt1Val)) p.sizes.push(opt1Val);
    if (price > 0 && (p.price === 0 || price < p.price)) p.price = price;
    if (compareAt > 0 && compareAt > p.compareAt) p.compareAt = compareAt;
    if (status) p.status = status;
  }

  // Free the lines array
  lines.length = 0;

  return products;
}

const fileCategoryMap: Record<string, string> = {
  "nike-1_products.csv": "Nike",
  "wallets_products.csv": "Wallets",
  "sunglasses_products.csv": "Sunglasses",
  "heels_products.csv": "Heels",
  "watches_products.csv": "Watches",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    // Process ONE file at a time to avoid memory limits
    const fileName: string = body.file || "wallets_products.csv";
    const fileCategory = fileCategoryMap[fileName] || "General";

    console.log(`=== Processing: ${fileName} ===`);

    // Download from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("product-images")
      .download(`imports/${fileName}`);

    if (dlError || !fileData) {
      throw new Error(`Failed to download ${fileName}: ${dlError?.message || "no data"}`);
    }

    let csvText = await fileData.text();
    if (csvText.charCodeAt(0) === 0xfeff) csvText = csvText.slice(1);
    console.log(`Downloaded ${fileName}, length: ${csvText.length}`);

    const productMap = parseShopifyCSV(csvText);
    // Free CSV text
    csvText = "";
    console.log(`Found ${productMap.size} unique products`);

    // Convert to DB format and upsert
    const dbProducts: Record<string, unknown>[] = [];
    for (const [, p] of productMap) {
      if (p.status !== "active" || p.price <= 0) continue;
      const category = detectCategory(p.title, fileCategory);
      const id = slugify(p.handle) || slugify(p.title);
      if (!id || !p.title) continue;
      const originalPrice = p.compareAt > p.price ? p.compareAt : null;
      const discountPercent = originalPrice
        ? Math.round(((originalPrice - p.price) / originalPrice) * 100)
        : 0;
      // Format sizes
      const numericSizes = p.sizes.filter(s => /^\d+/.test(s)).sort((a, b) => parseFloat(a) - parseFloat(b));
      let sizeStr = "Standard";
      if (numericSizes.length > 1) {
        sizeStr = `EU ${numericSizes[0]}-${numericSizes[numericSizes.length - 1]}`;
      } else if (numericSizes.length === 1) {
        sizeStr = `EU ${numericSizes[0]}`;
      } else if (p.sizes.length > 0) {
        sizeStr = p.sizes.join(", ");
      }

      dbProducts.push({
        id,
        name: p.title,
        description: p.description || `Premium ${category} product from Desert Deals`,
        price: p.price,
        original_price: originalPrice,
        discount_percent: discountPercent,
        stock_quantity: 50,
        category,
        size: sizeStr,
        image_url: p.images.join(", "),
        is_active: true,
        notes: { top: [], middle: [], base: [] },
      });
    }

    console.log(`Products to upsert: ${dbProducts.length}`);

    // Upsert in batches
    let imported = 0;
    const errors: string[] = [];
    const batchSize = 50;

    for (let i = 0; i < dbProducts.length; i += batchSize) {
      const batch = dbProducts.slice(i, i + batchSize);
      const { error } = await supabase.from("products").upsert(batch, { onConflict: "id" });
      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    console.log(`Imported ${imported} products from ${fileName}`);

    return new Response(JSON.stringify({
      success: true,
      file: fileName,
      totalFound: productMap.size,
      imported,
      errors,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Import error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
