import { Product } from "@/data/products";

let cachedFallback: Product[] | null = null;

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim() || "";
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

/** RFC 4180 parser that handles multi-line quoted fields */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      let value = "";
      if (text[i] === '"') {
        i++;
        while (i < len) {
          if (text[i] === '"') {
            if (i + 1 < len && text[i + 1] === '"') {
              value += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            value += text[i];
            i++;
          }
        }
      } else {
        while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          value += text[i];
          i++;
        }
      }
      row.push(value);
      if (i < len && text[i] === ",") {
        i++;
      } else {
        break;
      }
    }
    if (i < len && text[i] === "\r") i++;
    if (i < len && text[i] === "\n") i++;
    if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
      rows.push(row);
    }
  }
  return rows;
}

function extractCategory(categories: string): string {
  if (!categories) return "All Shoes";
  const cats = categories.split(",").map((c) => c.trim());
  const skip = ["all shoes", "all-shoes", "all products"];
  return cats.find((c) => !skip.includes(c.toLowerCase())) || cats[0] || "All Shoes";
}

export async function loadFallbackProducts(): Promise<Product[]> {
  if (cachedFallback) return cachedFallback;

  try {
    // Try the new exported CSV first, then the old WooCommerce one
    let resp = await fetch("/data/products-fallback.csv");
    if (!resp.ok) {
      resp = await fetch("/data/wc-product-export.csv");
    }
    if (!resp.ok) throw new Error("CSV fetch failed");

    let text = await resp.text();
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    const allRows = parseCSV(text);
    if (allRows.length < 2) return [];

    const headers = allRows[0];
    const colIdx: Record<string, number> = {};
    headers.forEach((h, i) => {
      colIdx[h.trim()] = i;
    });
    const col = (row: string[], name: string): string => {
      const idx = colIdx[name];
      return idx !== undefined && idx < row.length ? (row[idx] || "").trim() : "";
    };

    // Detect format: new export has "ID" column, old WooCommerce has "Name"
    const hasIdCol = colIdx["ID"] !== undefined;
    const products: Product[] = [];

    for (let r = 1; r < allRows.length && products.length < 1000; r++) {
      const row = allRows[r];

      if (hasIdCol) {
        // New format: ID,Name,Description,Price,Original Price,Discount %,Stock,Category,Size,Image URL,Status
        const status = col(row, "Status");
        if (status && status !== "Active") continue;

        const id = col(row, "ID");
        const name = col(row, "Name");
        if (!id || !name) continue;

        const price = parseFloat(col(row, "Price")) || 0;
        const originalPrice = parseFloat(col(row, "Original Price")) || price;
        const discount = parseInt(col(row, "Discount %")) || 0;
        if (price <= 0) continue;

        const category = extractCategory(col(row, "Category"));
        const images = col(row, "Image URL");
        const firstImage = images.split(",")[0]?.trim() || "";
        const gallery = images.split(",").map((u) => u.trim()).filter(Boolean);
        const stock = parseInt(col(row, "Stock")) || 0;

        products.push({
          id,
          name,
          tagline: category,
          description: stripHtml(col(row, "Description")),
          story: "",
          price,
          originalPrice,
          discountPercent: discount,
          category,
          size: col(row, "Size") || "EU 36-45",
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
          _stock: stock,
        } as Product & { _stock: number });
      } else {
        // Old WooCommerce format
        const type = col(row, "Type");
        const published = col(row, "Published");
        if (published !== "1") continue;
        if (type === "variation") continue;

        const name = col(row, "Name");
        if (!name) continue;

        const regularPrice = parseFloat(col(row, "Regular price")) || 0;
        const salePrice = parseFloat(col(row, "Sale price")) || regularPrice;
        if (salePrice <= 0 && regularPrice <= 0) continue;

        const price = salePrice > 0 ? salePrice : regularPrice;
        const origPrice = regularPrice > 0 ? regularPrice : price;
        const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

        const category = col(row, "Categories")?.split(",")[0]?.trim() || "General";
        const images = col(row, "Images") || "";
        const firstImage = images.split(",")[0]?.trim() || "";
        const gallery = images.split(",").map((u) => u.trim()).filter(Boolean);

        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `product-${r}`;

        products.push({
          id,
          name,
          tagline: category,
          description: stripHtml(col(row, "Description")),
          story: "",
          price,
          originalPrice: origPrice,
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
    }

    cachedFallback = products;
    return products;
  } catch (e) {
    console.error("CSV fallback failed:", e);
    return [];
  }
}
