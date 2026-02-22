import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle, AlertCircle, FileSpreadsheet, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
const parseWooCommerceData = (text: string): ParsedProduct[] => {
  // If it starts with pipe-delimited rows, use legacy parser
  if (text.split("\n").some((l) => l.startsWith("|"))) {
    return parseWooCommercePipe(text);
  }
  // Otherwise treat as CSV
  return parseWooCommerceCSV(text);
};

const AdminBulkImport = () => {
  const { toast } = useToast();
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replaceMode, setReplaceMode] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [shopifyImporting, setShopifyImporting] = useState(false);
  const [shopifyResult, setShopifyResult] = useState<Record<string, unknown> | null>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const products = parseWooCommerceData(text);

    if (products.length === 0) {
      toast({ title: "No products found", description: "Could not parse any products from the file. Make sure it's in the correct format.", variant: "destructive" });
      return;
    }

    setParsedProducts(products);
    setResult(null);
    toast({ title: `${products.length} products parsed`, description: "Review the preview below and click Import to add them to the database." });
  }, [toast]);

  const handlePasteImport = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const products = parseWooCommerceData(text);
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

  const handleShopifyImport = useCallback(async () => {
    const session = getAdminSession();
    if (!session) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }
    setShopifyImporting(true);
    setShopifyResult(null);
    const files = ["wallets_products.csv", "sunglasses_products.csv", "heels_products.csv", "watches_products.csv", "nike-1_products.csv"];
    let totalImported = 0;
    const allErrors: string[] = [];
    const fileSummaries: Record<string, number> = {};
    
    try {
      for (const file of files) {
        toast({ title: `Importing ${file}...` });
        const { data, error } = await supabase.functions.invoke("import-shopify-csv", {
          body: { file },
        });
        if (error) {
          allErrors.push(`${file}: ${error.message}`);
        } else {
          totalImported += data?.imported || 0;
          fileSummaries[file] = data?.imported || 0;
          if (data?.errors?.length) allErrors.push(...data.errors);
        }
      }
      setShopifyResult({ totalImported, totalSkipped: 0, errors: allErrors, fileSummaries });
      toast({
        title: `Import Complete`,
        description: `${totalImported} products imported from ${files.length} files`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Shopify import failed", description: msg, variant: "destructive" });
    } finally {
      setShopifyImporting(false);
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Bulk Import Products</h1>
        <p className="text-muted-foreground">
          Import products from your WooCommerce export file (CSV or pipe-delimited)
        </p>
      </div>

      {/* Shopify CSV Import Section */}
      <div className="border border-border rounded-lg p-6 space-y-4 bg-card">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Shopify Product Import
        </h2>
        <p className="text-sm text-muted-foreground">
          Import all uploaded Shopify CSVs (Nike, Wallets, Sunglasses, Heels, Watches). Vendor names will be changed to Desert Deals and products auto-categorized.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleShopifyImport}
            disabled={shopifyImporting}
          >
            {shopifyImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing Shopify CSVs...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import All Shopify CSVs
              </>
            )}
          </Button>
        </div>
        {shopifyResult && (
          <div className="p-4 rounded-lg border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="font-medium">
                {(shopifyResult as Record<string, number>).totalImported || 0} products imported, {(shopifyResult as Record<string, number>).totalSkipped || 0} skipped
              </span>
            </div>
            {(shopifyResult as Record<string, string[]>).errors?.length > 0 && (
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                {((shopifyResult as Record<string, string[]>).errors || []).slice(0, 5).map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <p className="font-medium">Upload your product export file</p>
          <p className="text-sm text-muted-foreground">
            Supports CSV or pipe-delimited text files exported from WooCommerce
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,.txt,.tsv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
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
            <div className={`p-4 rounded-lg border ${result.errors.length > 0 ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.errors.length > 0 ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
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
