import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\\</g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000);
}

function extractCategory(categories: string): string {
  if (!categories) return 'All Shoes';
  const cats = categories.split(',').map(c => c.trim());
  const brands = ['Nike', 'Adidas', 'Jordan', 'Asics', 'Hoka', 'New Balance', 'Puma', 'Reebok', 'Converse', 'Vans', 'On Cloud', 'Brooks'];
  for (const cat of cats) {
    for (const brand of brands) {
      if (cat.toLowerCase().includes(brand.toLowerCase())) return cat;
    }
  }
  const subCats = ['Running Shoes', 'Basketball Shoes', 'Casual Shoes', 'Slides', 'Slippers'];
  for (const cat of cats) {
    for (const sub of subCats) {
      if (cat.toLowerCase().includes(sub.toLowerCase())) return cat;
    }
  }
  return cats.find(c => c !== 'All Shoes' && c !== 'All Products') || cats[0] || 'All Shoes';
}

function extractFirstImage(images: string): string {
  if (!images) return '';
  const first = images.split(',')[0].trim();
  return first;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download xlsx from storage
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/product-images/import/Desert_deal_products.xlsx`;
    console.log("Fetching xlsx from:", fileUrl);
    
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch xlsx: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log("Downloaded xlsx, size:", arrayBuffer.byteLength);
    
    // Parse xlsx
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    
    console.log("Total rows in xlsx:", rows.length);

    // Column mapping for WooCommerce export
    const getVal = (row: Record<string, string>, ...keys: string[]): string => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    // Separate parents (variable) and variations
    interface ParentProduct {
      id: string;
      sku: string;
      name: string;
      description: string;
      categories: string;
      images: string;
      published: string;
      attrValue: string;
    }
    
    interface VariationProduct {
      parent: string;
      salePrice: number;
      regularPrice: number;
    }

    const parents: ParentProduct[] = [];
    const variationsByParent: Record<string, VariationProduct> = {};

    for (const row of rows) {
      const type = getVal(row, 'Type');
      const id = getVal(row, 'ID');
      
      if (type === 'variable') {
        parents.push({
          id,
          sku: getVal(row, 'SKU'),
          name: getVal(row, 'Name'),
          description: getVal(row, 'Description', 'Short description'),
          categories: getVal(row, 'Categories'),
          images: getVal(row, 'Images'),
          published: getVal(row, 'Published'),
          attrValue: getVal(row, 'Attribute 1 value(s)'),
        });
      } else if (type === 'variation') {
        const parentRef = getVal(row, 'Parent');
        if (parentRef && !variationsByParent[parentRef]) {
          const sale = parseFloat(getVal(row, 'Sale price')) || 0;
          const regular = parseFloat(getVal(row, 'Regular price')) || 0;
          if (sale > 0 || regular > 0) {
            variationsByParent[parentRef] = { parent: parentRef, salePrice: sale, regularPrice: regular };
          }
        }
      }
    }

    console.log("Parent products found:", parents.length);
    console.log("Variation price mappings:", Object.keys(variationsByParent).length);

    // Build products to insert
    const products = parents.map(p => {
      const sku = p.sku || `product-${p.id}`;
      const prices = variationsByParent[sku] || { salePrice: 0, regularPrice: 0 };
      const price = prices.salePrice > 0 ? prices.salePrice : prices.regularPrice;
      const originalPrice = prices.regularPrice > 0 ? prices.regularPrice : null;
      const discountPercent = (price > 0 && originalPrice && originalPrice > price)
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
      const category = extractCategory(p.categories);
      const imageUrl = extractFirstImage(p.images);
      const description = stripHtml(p.description);

      return {
        id: sku,
        name: p.name,
        description: description || `Premium ${category} footwear from Desert Deal`,
        price: price > 0 ? price : 199,
        original_price: originalPrice,
        discount_percent: discountPercent,
        stock_quantity: 50,
        category,
        size: 'EU 36-45',
        image_url: imageUrl,
        is_active: p.published !== '0',
        notes: { top: [], middle: [], base: [] },
      };
    }).filter(p => p.name && p.id);

    console.log("Products to insert:", products.length);

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
      total_rows: rows.length,
      total_parents: parents.length,
      imported,
      errors,
      sample_products: products.slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Import error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg, stack: error instanceof Error ? error.stack : undefined }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
