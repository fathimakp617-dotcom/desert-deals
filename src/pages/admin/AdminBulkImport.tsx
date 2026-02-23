import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle, AlertCircle, FileSpreadsheet, Trash2, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ParsedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  discount_percent: number;
  stock_quantity: number;
  category: string;
  size: string;
  image_url: string;
  is_active: boolean;
  notes: { top: string[]; middle: string[]; base: string[] };
}

const getAdminSession = () => {
  const stored = sessionStorage.getItem("rayn_admin_session");
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    if (new Date(session.expiry) > new Date()) return session;
  } catch {
    return null;
  }
  return null;
};

/** Generates a URL-friendly slug from product name */
const slugify = (name: string, wooId: string): string => {
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80);
  return slug || `product-${wooId}`;
};

/** Strip HTML tags from text */
const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
};

/** Extract first image URL from comma-separated list */
const extractFirstImage = (images: string): string => {
  if (!images) return "";
  const first = images.split(",")[0].trim();
  return first.replace(/\\:/g, ":").replace(/\\_/g, "_");
};

/** Extract brand/category from WooCommerce categories string */
const extractCategory = (cats: string): string => {
  if (!cats) return "All Shoes";
  const parts = cats.split(",").map((c) => c.trim());
  const brand = parts.find((p) => p !== "All Shoes" && p !== "Uncategorized");
  return brand || parts[0] || "All Shoes";
};

/** Detect brand/category from product title */
const detectCategoryFromTitle = (title: string): string => {
  const t = title.toLowerCase();
  const brandMap: [string[], string][] = [
    [["nike", "air max", "air force", "dunk", "flyknit", "vapormax"], "Nike"],
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
    [["omega", "audemars", "patek", "richard mille", "tag heuer", "hublot"], "Watches"],
  ];
  for (const [keywords, brand] of brandMap) {
    for (const kw of keywords) {
      if (t.includes(kw)) return brand;
    }
  }
  return "";
};

/** Parse Shopify CSV format */
const parseShopifyCSV = (text: string): ParsedProduct[] => {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const colIndex = (name: string): number => headers.findIndex((h) => h.trim() === name);

  const iHandle = colIndex("Handle");
  const iTitle = colIndex("Title");
  const iBody = colIndex("Body (HTML)");
  const iPrice = colIndex("Variant Price");
  const iCompare = colIndex("Variant Compare At Price");
  const iImage = colIndex("Image Src");
  const iStatus = colIndex("Status");
  const iOpt1Val = colIndex("Option1 Value");

  if (iHandle < 0) return []; // Not a Shopify CSV

  const productMap = new Map<string, {
    handle: string; title: string; description: string;
    price: number; compareAt: number; images: string[];
    sizes: string[]; status: string;
  }>();

  const getCol = (row: string[], idx: number): string => (idx >= 0 && idx < row.length ? row[idx].trim() : "");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const handle = getCol(row, iHandle);
    if (!handle) continue;

    const title = getCol(row, iTitle);
    const imageUrl = getCol(row, iImage);
    const price = parseFloat(getCol(row, iPrice)) || 0;
    const compareAt = parseFloat(getCol(row, iCompare)) || 0;
    const status = getCol(row, iStatus);
    const opt1Val = getCol(row, iOpt1Val);

    if (!productMap.has(handle)) {
      productMap.set(handle, {
        handle,
        title: title || handle,
        description: stripHtml(getCol(row, iBody)),
        price,
        compareAt,
        images: [],
        sizes: [],
        status: status || "active",
      });
    }

    const p = productMap.get(handle)!;
    if (title && p.title === handle) p.title = title;
    const desc = stripHtml(getCol(row, iBody));
    if (desc && !p.description) p.description = desc;
    if (imageUrl && !p.images.includes(imageUrl)) p.images.push(imageUrl);
    if (opt1Val && opt1Val !== "Default Title" && !p.sizes.includes(opt1Val)) p.sizes.push(opt1Val);
    if (price > 0 && (p.price === 0 || price < p.price)) p.price = price;
    if (compareAt > 0 && compareAt > p.compareAt) p.compareAt = compareAt;
    if (status) p.status = status;
  }

  const products: ParsedProduct[] = [];
  for (const [, p] of productMap) {
    if (p.status !== "active" || p.price <= 0) continue;
    const id = slugify(p.handle, p.handle) || slugify(p.title, p.handle);
    if (!id || !p.title) continue;

    const category = detectCategoryFromTitle(p.title) || "General";
    const originalPrice = p.compareAt > p.price ? p.compareAt : p.price * 2;
    const discount = Math.round(((originalPrice - p.price) / originalPrice) * 100);

    const numericSizes = p.sizes.filter(s => /^\d+/.test(s)).sort((a, b) => parseFloat(a) - parseFloat(b));
    let sizeStr = "Standard";
    if (numericSizes.length > 1) {
      sizeStr = `EU ${numericSizes[0]}-${numericSizes[numericSizes.length - 1]}`;
    } else if (numericSizes.length === 1) {
      sizeStr = `EU ${numericSizes[0]}`;
    } else if (p.sizes.length > 0) {
      sizeStr = p.sizes.join(", ");
    }

    products.push({
      id,
      name: p.title,
      description: p.description || `Premium ${category} product from Desert Deals`,
      price: p.price,
      original_price: originalPrice,
      discount_percent: discount,
      stock_quantity: 50,
      category,
      size: sizeStr,
      image_url: p.images.join(", "),
      is_active: true,
      notes: { top: [], middle: [], base: [] },
    });
  }

  return products;
};

/**
 * RFC 4180 compliant CSV parser that handles:
 * - Quoted fields with commas
 * - Multi-line quoted fields (newlines inside quotes)
 * - Escaped quotes ("" inside quoted fields)
 */
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) i = 1;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        currentField += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = "";
        i++;
      } else if (ch === '\n' || (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n')) {
        currentRow.push(currentField);
        currentField = "";
        if (currentRow.length > 1) {
          rows.push(currentRow);
        }
        currentRow = [];
        i += ch === '\r' ? 2 : 1;
      } else if (ch === '\r') {
        currentRow.push(currentField);
        currentField = "";
        if (currentRow.length > 1) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
      } else {
        currentField += ch;
        i++;
      }
    }
  }

  // Don't forget the last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1) {
      rows.push(currentRow);
    }
  }

  return rows;
};

/**
 * Parse WooCommerce CSV export into product objects.
 * Processes `variable` type rows (parent products) and gets prices from their first `variation` child.
 */
const parseWooCommerceCSV = (text: string): ParsedProduct[] => {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  // Build header index map
  const headers = rows[0];
  const colIndex = (name: string): number => headers.findIndex((h) => h.trim() === name);

  const iID = colIndex("ID");
  const iType = colIndex("Type");
  const iSKU = colIndex("SKU");
  const iName = colIndex("Name");
  const iPublished = colIndex("Published");
  const iDesc = colIndex("Description");
  const iShortDesc = colIndex("Short description");
  const iInStock = colIndex("In stock?");
  const iStock = colIndex("Stock");
  const iSalePrice = colIndex("Sale price");
  const iRegPrice = colIndex("Regular price");
  const iCategories = colIndex("Categories");
  const iImages = colIndex("Images");
  const iAttr1Name = colIndex("Attribute 1 name");
  const iAttr1Values = colIndex("Attribute 1 value(s)");

  const products: ParsedProduct[] = [];
  const seenIds = new Set<string>();

  let currentParent: {
    wooId: string;
    sku: string;
    name: string;
    description: string;
    categories: string;
    images: string;
    sizes: string;
    inStock: boolean;
    stockQty: number;
  } | null = null;

  let parentPrice = 0;
  let parentOrigPrice = 0;
  let gotPriceFromVariation = false;

  const flushParent = () => {
    if (!currentParent) return;
    const id = currentParent.sku
      ? currentParent.sku
      : slugify(currentParent.name, currentParent.wooId);
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const price = parentPrice || 0;
    const origPrice = parentOrigPrice || price * 2;
    const discount = origPrice > price && price > 0 ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

    const desc = currentParent.description
      ? stripHtml(currentParent.description).substring(0, 2000)
      : "";

    products.push({
      id,
      name: currentParent.name,
      description: desc,
      price,
      original_price: origPrice,
      discount_percent: discount,
      stock_quantity: currentParent.stockQty || 50,
      category: extractCategory(currentParent.categories),
      size: currentParent.sizes ? `EU ${currentParent.sizes}` : "EU 36-45",
      image_url: extractFirstImage(currentParent.images),
      is_active: currentParent.inStock,
      notes: { top: [], middle: [], base: [] },
    });
  };

  const getCol = (row: string[], idx: number): string => (idx >= 0 && idx < row.length ? row[idx] : "");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const type = getCol(row, iType).trim();
    const wooId = getCol(row, iID).trim();
    const sku = getCol(row, iSKU).trim();
    const name = getCol(row, iName).trim();
    const description = getCol(row, iDesc) || getCol(row, iShortDesc) || "";
    const inStock = getCol(row, iInStock).trim();
    const stockQty = getCol(row, iStock).trim();
    const salePrice = getCol(row, iSalePrice).trim();
    const regularPrice = getCol(row, iRegPrice).trim();
    const categories = getCol(row, iCategories).trim();
    const images = getCol(row, iImages).trim();

    // Get sizes from attribute
    const attr1Name = getCol(row, iAttr1Name).trim().toLowerCase();
    const attr1Values = getCol(row, iAttr1Values).trim();
    const sizeValues = (attr1Name === "size" || attr1Name === "shoe size") ? attr1Values : "";

    if (type === "variable") {
      flushParent();

      currentParent = {
        wooId,
        sku,
        name,
        description,
        categories,
        images,
        sizes: sizeValues.replace(/\s/g, ""),
        inStock: inStock !== "0",
        stockQty: parseInt(stockQty) || 50,
      };
      parentPrice = parseFloat(salePrice) || 0;
      parentOrigPrice = parseFloat(regularPrice) || 0;
      gotPriceFromVariation = false;
    } else if (type === "variation" && currentParent && !gotPriceFromVariation) {
      const vSale = parseFloat(salePrice);
      const vReg = parseFloat(regularPrice);
      if (vSale > 0 || vReg > 0) {
        parentPrice = vSale > 0 ? vSale : parentPrice;
        parentOrigPrice = vReg > 0 ? vReg : parentOrigPrice;
        gotPriceFromVariation = true;
      }
    }
  }

  flushParent();
  return products;
};

/**
 * Parse pipe-delimited text (legacy format from xlsx parse)
 */
const parseWooCommercePipe = (text: string): ParsedProduct[] => {
  const lines = text.split("\n").filter((l) => l.startsWith("|"));
  if (lines.length < 2) return [];

  const products: ParsedProduct[] = [];
  const seenIds = new Set<string>();

  let currentParent: {
    wooId: string;
    slug: string;
    name: string;
    description: string;
    categories: string;
    images: string;
    sizes: string;
    inStock: boolean;
    stockQty: number;
    sku: string;
  } | null = null;

  let parentPrice = 0;
  let parentOrigPrice = 0;
  let gotPriceFromVariation = false;

  const flushParent = () => {
    if (!currentParent) return;
    const id = currentParent.slug || slugify(currentParent.name, currentParent.wooId);
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const price = parentPrice || 0;
    const origPrice = parentOrigPrice || price * 2;
    const discount = origPrice > price && price > 0 ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

    products.push({
      id,
      name: currentParent.name,
      description: stripHtml(currentParent.description).substring(0, 2000),
      price,
      original_price: origPrice,
      discount_percent: discount,
      stock_quantity: currentParent.stockQty || 10,
      category: extractCategory(currentParent.categories),
      size: currentParent.sizes ? `EU ${currentParent.sizes}` : "EU 36-45",
      image_url: extractFirstImage(currentParent.images),
      is_active: currentParent.inStock,
      notes: { top: [], middle: [], base: [] },
    });
  };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("|").map((c) => c.trim());
    const wooId = cols[1] || "";
    const type = cols[2] || "";
    const sku = cols[3] || "";
    const name = cols[5] || "";
    const description = cols[10] || "";
    const inStock = cols[15] || "";
    const stockQty = cols[16] || "";
    const salePrice = cols[27] || "";
    const regularPrice = cols[28] || "";
    const categories = cols[29] || "";
    const images = cols[32] || "";
    const sizeValues = cols[44] || "";

    if (type === "variable") {
      flushParent();
      currentParent = {
        wooId,
        slug: sku ? slugify(name, wooId) : slugify(name, wooId),
        name,
        description,
        categories,
        images,
        sizes: sizeValues,
        inStock: inStock !== "0",
        stockQty: parseInt(stockQty) || 10,
        sku,
      };
      parentPrice = parseFloat(salePrice) || 0;
      parentOrigPrice = parseFloat(regularPrice) || 0;
      gotPriceFromVariation = false;
    } else if (type === "variation" && currentParent && !gotPriceFromVariation) {
      const vSale = parseFloat(salePrice);
      const vReg = parseFloat(regularPrice);
      if (vSale > 0 || vReg > 0) {
        parentPrice = vSale > 0 ? vSale : parentPrice;
        parentOrigPrice = vReg > 0 ? vReg : parentOrigPrice;
        gotPriceFromVariation = true;
      }
    }
  }

  flushParent();
  return products;
};

/** Auto-detect format and parse */
const parseProductData = (text: string): ParsedProduct[] => {
  // Try Shopify format first (has "Handle" header)
  const firstLine = text.split("\n")[0] || "";
  if (firstLine.includes("Handle") && firstLine.includes("Variant Price")) {
    return parseShopifyCSV(text);
  }
  // If it starts with pipe-delimited rows, use legacy parser
  if (text.split("\n").some((l) => l.startsWith("|"))) {
    return parseWooCommercePipe(text);
  }
  // Otherwise treat as WooCommerce CSV
  return parseWooCommerceCSV(text);
};

const AdminBulkImport = () => {
  const { toast } = useToast();
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replaceMode, setReplaceMode] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const handleMultiFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let allProducts: ParsedProduct[] = [];
    for (let i = 0; i < files.length; i++) {
      const text = await files[i].text();
      const products = parseProductData(text);
      allProducts = allProducts.concat(products);
    }

    if (allProducts.length === 0) {
      toast({ title: "No products found", description: "Could not parse any products. Make sure files are in Shopify or WooCommerce CSV format.", variant: "destructive" });
      return;
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    allProducts = allProducts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    setParsedProducts(allProducts);
    setResult(null);
    toast({ title: `${allProducts.length} products parsed from ${files.length} file(s)`, description: "Review the preview below and click Import." });
  }, [toast]);

  const handlePasteImport = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const products = parseProductData(text);
      if (products.length === 0) {
        toast({ title: "No products found in clipboard", variant: "destructive" });
        return;
      }
      setParsedProducts(products);
      setResult(null);
      toast({ title: `${products.length} products parsed from clipboard` });
    } catch {
      toast({ title: "Could not read clipboard", variant: "destructive" });
    }
  }, [toast]);

  const importMutation = useMutation({
    mutationFn: async (products: ParsedProduct[]) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      setImporting(true);
      setProgress(0);

      // If replace mode, delete all existing products first
      if (replaceMode) {
        const { error: delError } = await supabase.functions.invoke("manage-products", {
          body: { action: "delete_all", admin_email: session.email, admin_token: session.token },
        });
        if (delError) {
          throw new Error(`Failed to clear products: ${delError.message}`);
        }
      }

      // Send in batches of 50
      const batchSize = 50;
      let totalImported = 0;
      let totalSkipped = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

        const { data, error } = await supabase.functions.invoke("manage-products", {
          body: { action: "bulk_import", products: batch, admin_email: session.email, admin_token: session.token },
        });

        if (error) {
          allErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          totalSkipped += batch.length;
        } else {
          totalImported += data.imported || 0;
          totalSkipped += data.skipped || 0;
          if (data.errors?.length) allErrors.push(...data.errors);
        }

        setProgress(Math.round(((i + batch.length) / products.length) * 100));
      }

      return { imported: totalImported, skipped: totalSkipped, errors: allErrors };
    },
    onSuccess: (data) => {
      setResult(data);
      setImporting(false);
      toast({ title: `Import complete: ${data.imported} products added` });
    },
    onError: (error: Error) => {
      setImporting(false);
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    },
  });


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Bulk Import Products</h1>
        <p className="text-muted-foreground">
          Upload product CSV files to import. Supports Shopify and WooCommerce export formats.
        </p>
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <p className="font-medium">Upload your product export file</p>
          <p className="text-sm text-muted-foreground">
            Auto-detects Shopify CSV (Handle column) or WooCommerce CSV/pipe-delimited formats.
            Vendor names are replaced with Desert Deals and products are auto-categorized by brand.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,.txt,.tsv"
              multiple
              className="hidden"
              onChange={handleMultiFileUpload}
            />
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </span>
            </Button>
          </label>
          <Button variant="outline" onClick={handlePasteImport}>
            Paste from Clipboard
          </Button>
        </div>
      </div>

      {/* Preview */}
      {parsedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold">
              Preview ({parsedProducts.length} products)
            </h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceMode}
                  onChange={(e) => setReplaceMode(e.target.checked)}
                  className="rounded"
                />
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                Replace all existing products
              </label>
              <Button
                onClick={() => importMutation.mutate(parsedProducts)}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {replaceMode ? "Replace" : "Import"} {parsedProducts.length} Products
                  </>
                )}
              </Button>
            </div>
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">{progress}%</p>
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-lg border ${result.errors.length > 0 ? "border-destructive bg-destructive/10" : "border-primary bg-primary/10"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.errors.length > 0 ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
                <span className="font-medium">
                  {result.imported} imported, {result.skipped} skipped
                </span>
              </div>
              {result.errors.length > 0 && (
                <ul className="text-sm text-muted-foreground list-disc pl-5">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Product table preview */}
          <div className="rounded-md border overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left">Image</th>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Price</th>
                  <th className="p-2 text-left">Original</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Size</th>
                </tr>
              </thead>
              <tbody>
                {parsedProducts.slice(0, 50).map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded" />
                      )}
                    </td>
                    <td className="p-2 font-mono text-xs max-w-[120px] truncate">{p.id}</td>
                    <td className="p-2 max-w-[200px] truncate">{p.name}</td>
                    <td className="p-2">AED {p.price}</td>
                    <td className="p-2 text-muted-foreground">AED {p.original_price}</td>
                    <td className="p-2">{p.category}</td>
                    <td className="p-2 text-xs">{p.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedProducts.length > 50 && (
              <p className="p-3 text-center text-sm text-muted-foreground">
                Showing first 50 of {parsedProducts.length} products...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBulkImport;
