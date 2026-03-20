import { Product } from "@/data/products";

let cachedFallback: Product[] | null = null;

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, "").trim() || "";
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function loadFallbackProducts(): Promise<Product[]> {
  if (cachedFallback) return cachedFallback;

  try {
    const resp = await fetch("/data/wc-product-export.csv");
    if (!resp.ok) throw new Error("CSV fetch failed");
    const text = await resp.text();

    const lines = text.split("\n");
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const nameIdx = headers.indexOf("Name");
    const descIdx = headers.indexOf("Description");
    const saleIdx = headers.indexOf("Sale price");
    const regIdx = headers.indexOf("Regular price");
    const catIdx = headers.indexOf("Categories");
    const imgIdx = headers.indexOf("Images");
    const typeIdx = headers.indexOf("Type");
    const publishedIdx = headers.indexOf("Published");

    const products: Product[] = [];

    for (let i = 1; i < lines.length && products.length < 500; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCSVLine(line);
      const type = fields[typeIdx]?.trim();
      const published = fields[publishedIdx]?.trim();

      // Only include published parent/simple products
      if (published !== "1") continue;
      if (type === "variation") continue;

      const name = fields[nameIdx]?.trim();
      if (!name) continue;

      const regularPrice = parseFloat(fields[regIdx]) || 0;
      const salePrice = parseFloat(fields[saleIdx]) || regularPrice;
      if (salePrice <= 0 && regularPrice <= 0) continue;

      const price = salePrice > 0 ? salePrice : regularPrice;
      const originalPrice = regularPrice > 0 ? regularPrice : price;
      const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

      const category = fields[catIdx]?.trim().split(",")[0]?.trim() || "General";
      const images = fields[imgIdx]?.trim() || "";
      const firstImage = images.split(",")[0]?.trim() || "";
      const gallery = images.split(",").map(u => u.trim()).filter(Boolean);

      const id = slugify(name) || `product-${i}`;

      products.push({
        id,
        name,
        tagline: category,
        description: stripHtml(fields[descIdx] || ""),
        story: "",
        price,
        originalPrice,
        discountPercent: discount,
        category,
        size: "Standard",
        image: firstImage,
        gallery: gallery.length ? gallery : [firstImage],
        construction: { upper: [], midsole: [], outsole: [] },
        materials: [],
        style: "",
        comfort: "",
        fit: "",
        season: [],
        occasion: [],
        crossSellPrice: null,
      });
    }

    cachedFallback = products;
    return products;
  } catch (e) {
    console.error("CSV fallback failed:", e);
    return [];
  }
}
