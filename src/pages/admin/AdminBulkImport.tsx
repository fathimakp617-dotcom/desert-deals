import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
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
    if (session.expiry > Date.now()) return session;
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
  // Unescape backslashes from parsed markdown
  return first.replace(/\\:/g, ":").replace(/\\_/g, "_");
};

/** Extract brand/category from WooCommerce categories string */
const extractCategory = (cats: string): string => {
  if (!cats) return "All Shoes";
  // Categories like "All Shoes, Nike" or "Adidas, All Shoes"
  const parts = cats.split(",").map((c) => c.trim());
  // Prefer brand-specific category over "All Shoes"
  const brand = parts.find((p) => p !== "All Shoes" && p !== "Uncategorized");
  return brand || parts[0] || "All Shoes";
};

/**
 * Parse WooCommerce export text (pipe-delimited table from xlsx parse)
 * into product objects. Only processes `variable` type rows (parent products)
 * and gets prices from their first `variation` child.
 */
const parseWooCommerceData = (text: string): ParsedProduct[] => {
  const lines = text.split("\n").filter((l) => l.startsWith("|"));
  if (lines.length < 2) return [];

  const products: ParsedProduct[] = [];
  const seenIds = new Set<string>();

  // Track current parent for getting variation prices
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
    // cols[0] is empty (before first pipe), actual data starts at cols[1]
    const wooId = cols[1] || "";
    const type = cols[2] || "";
    const sku = cols[3] || "";
    const name = cols[5] || "";
    const published = cols[6] || "";
    const description = cols[10] || "";
    const inStock = cols[15] || "";
    const stockQty = cols[16] || "";
    const salePrice = cols[27] || "";
    const regularPrice = cols[28] || "";
    const categories = cols[29] || "";
    const images = cols[32] || "";
    const sizeValues = cols[44] || "";

    if (type === "variable") {
      // Flush previous parent
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
      // Get price from first variation
      const vSale = parseFloat(salePrice);
      const vReg = parseFloat(regularPrice);
      if (vSale > 0 || vReg > 0) {
        parentPrice = vSale > 0 ? vSale : parentPrice;
        parentOrigPrice = vReg > 0 ? vReg : parentOrigPrice;
        gotPriceFromVariation = true;
      }
    }
  }

  // Flush last parent
  flushParent();

  return products;
};

const AdminBulkImport = () => {
  const { toast } = useToast();
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we expect a text/CSV file or we'll read the parsed data
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

      // Send in batches of 50 to avoid payload limits
      const batchSize = 50;
      let totalImported = 0;
      let totalSkipped = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

        const { data, error } = await supabase.functions.invoke("manage-products", {
          body: { action: "bulk_import", products: batch },
          headers: { Authorization: `Bearer ${session.token}` },
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
          Import products from your WooCommerce export file
        </p>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Preview ({parsedProducts.length} products)
            </h2>
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
                  Import {parsedProducts.length} Products
                </>
              )}
            </Button>
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
