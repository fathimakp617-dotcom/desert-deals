import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000);
}

function extractCategory(categories: string): string {
  if (!categories) return 'All Shoes';
  const cats = categories.split(',').map(c => c.trim());
  const brands = ['Nike', 'Adidas', 'Jordan', 'Asics', 'Hoka', 'New Balance', 'Puma', 'On Cloud', 'Onitsuka Tiger', 'BAPE', 'Dior', 'Gucci', 'Hermès', 'Louis Vuitton'];
  for (const cat of cats) {
    for (const brand of brands) {
      if (cat.toLowerCase().includes(brand.toLowerCase())) return cat;
    }
  }
  return cats.find(c => c !== 'All Shoes' && c !== 'All Products') || cats[0] || 'All Shoes';
}

/** RFC 4180 CSV parser handling multi-line quoted fields */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      let value = '';
      if (text[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        while (i < len) {
          if (text[i] === '"') {
            if (i + 1 < len && text[i + 1] === '"') {
              value += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            value += text[i];
            i++;
          }
        }
      } else {
        // Unquoted field
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          value += text[i];
          i++;
        }
      }
      row.push(value);
      if (i < len && text[i] === ',') {
        i++; // skip comma
      } else {
        break; // end of row
      }
    }
    // Skip line endings
    if (i < len && text[i] === '\r') i++;
    if (i < len && text[i] === '\n') i++;
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
      rows.push(row);
    }
  }
  return rows;
}

function slugify(name: string, wooId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/["'""'']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 70);
  // Always append wooId to ensure uniqueness
  return base ? `${base}-${wooId}` : `product-${wooId}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download CSV from storage
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/product-images/imports/wc-product-export.csv`;
    console.log("Fetching CSV from:", fileUrl);

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    let text = await response.text();
    // Remove BOM if present
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    console.log("Downloaded CSV, length:", text.length);

    const allRows = parseCSV(text);
    if (allRows.length < 2) {
      throw new Error("CSV has no data rows");
    }

    const headers = allRows[0];
    console.log("CSV headers count:", headers.length);
    console.log("CSV data rows:", allRows.length - 1);

    // Build column index map
    const colIdx: Record<string, number> = {};
    headers.forEach((h, i) => { colIdx[h.trim()] = i; });

    const col = (row: string[], name: string): string => {
      const idx = colIdx[name];
      return idx !== undefined && idx < row.length ? (row[idx] || '').trim() : '';
    };

    // Separate parents and variations
    interface ParentData {
      wooId: string;
      sku: string;
      name: string;
      description: string;
      categories: string;
      images: string;
      published: string;
      sizes: string;
    }

    const parents: ParentData[] = [];
    const variationPrices: Record<string, { sale: number; regular: number }> = {};

    for (let r = 1; r < allRows.length; r++) {
      const row = allRows[r];
      const type = col(row, 'Type');
      const wooId = col(row, 'ID');

      if (type === 'variable') {
        parents.push({
          wooId,
          sku: col(row, 'SKU'),
          name: col(row, 'Name'),
          description: col(row, 'Description') || col(row, 'Short description'),
          categories: col(row, 'Categories'),
          images: col(row, 'Images'),
          published: col(row, 'Published'),
          sizes: col(row, 'Attribute 1 value(s)'),
        });
      } else if (type === 'variation') {
        const parentSku = col(row, 'Parent');
        if (parentSku && !variationPrices[parentSku]) {
          const sale = parseFloat(col(row, 'Sale price')) || 0;
          const regular = parseFloat(col(row, 'Regular price')) || 0;
          if (sale > 0 || regular > 0) {
            variationPrices[parentSku] = { sale, regular };
          }
        }
      } else if (type === 'simple') {
        // Simple products (no variations)
        const sale = parseFloat(col(row, 'Sale price')) || 0;
        const regular = parseFloat(col(row, 'Regular price')) || 0;
        const price = sale > 0 ? sale : regular;
        if (col(row, 'Name') && price > 0) {
          parents.push({
            wooId,
            sku: col(row, 'SKU'),
            name: col(row, 'Name'),
            description: col(row, 'Description') || col(row, 'Short description'),
            categories: col(row, 'Categories'),
            images: col(row, 'Images'),
            published: col(row, 'Published'),
            sizes: col(row, 'Attribute 1 value(s)'),
          });
          const sku = col(row, 'SKU') || `product-${wooId}`;
          variationPrices[sku] = { sale, regular };
        }
      }
    }

    console.log("Parent products found:", parents.length);
    console.log("Variation price mappings:", Object.keys(variationPrices).length);

    // Build products for upsert
    const products = parents.map(p => {
      const sku = p.sku || `product-${p.wooId}`;
      const id = slugify(p.name, p.wooId);
      const prices = variationPrices[sku] || { sale: 0, regular: 0 };
      const price = prices.sale > 0 ? prices.sale : prices.regular;
      const originalPrice = prices.regular > 0 ? prices.regular : null;
      const discountPercent = (price > 0 && originalPrice && originalPrice > price)
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
      const category = extractCategory(p.categories);
      const imageUrl = p.images || '';
      const description = stripHtml(p.description);

      // Parse sizes
      const sizeStr = p.sizes
        ? 'EU ' + p.sizes.split(',').map(s => s.trim()).filter(Boolean).join(', ')
        : 'EU 36-45';

      return {
        id,
        name: p.name,
        description: description || `Premium ${category} footwear from Desert Deal`,
        price: price > 0 ? price : 199,
        original_price: originalPrice,
        discount_percent: discountPercent,
        stock_quantity: 50,
        category,
        size: sizeStr,
        image_url: imageUrl,
        is_active: p.published !== '0',
        notes: { top: [], middle: [], base: [] },
      };
    }).filter(p => p.name && p.id);

    console.log("Products to upsert:", products.length);

    // Upsert in batches of 50
    let imported = 0;
    const errors: string[] = [];
    const batchSize = 50;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const { error } = await supabase
        .from("products")
        .upsert(batch, { onConflict: "id" });

      if (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error);
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
        console.log(`Batch ${Math.floor(i / batchSize) + 1}: inserted ${batch.length} products`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_csv_rows: allRows.length - 1,
      total_parents: parents.length,
      imported,
      errors,
      sample_products: products.slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, image_url: p.image_url?.substring(0, 80) })),
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
