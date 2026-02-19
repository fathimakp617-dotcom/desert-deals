import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, ImageOff, Check, Upload, Search, ChevronLeft, ChevronRight,
  FolderUp, Wand2, AlertCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
}

interface StorageFile {
  name: string;
  url: string;
}

const PRODUCTS_PER_PAGE = 20;

const getAdminSession = () => {
  try {
    const stored = sessionStorage.getItem("rayn_admin_session");
    if (!stored) return null;
    const session = JSON.parse(stored);
    if (new Date(session.expiry) < new Date()) return null;
    return session;
  } catch {
    return null;
  }
};

const AdminImageFix = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storagePage, setStoragePage] = useState(0);
  const [storageSearch, setStorageSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-match state
  const [autoMatching, setAutoMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState({ matched: 0, unmatched: 0, total: 0, remaining: 0 });

  // Migration state (download from domain -> upload to storage)
  const [migrating, setMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState({ processed: 0, remaining: 0, success: 0, failed: 0 });
  const migrationAbortRef = useRef(false);

  const startMigration = async () => {
    setMigrating(true);
    migrationAbortRef.current = false;
    setMigrationProgress({ processed: 0, remaining: 0, success: 0, failed: 0 });

    let offset = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalProcessed = 0;
    const BATCH = 10;

    try {
      while (!migrationAbortRef.current) {
        const res = await supabase.functions.invoke("migrate-product-images", {
          body: { batch_size: BATCH, offset: 0 },
        });

        if (res.error) throw new Error(res.error.message || "Migration failed");
        const data = res.data;

        if (data.done) {
          setMigrationProgress(prev => ({ ...prev, remaining: 0 }));
          break;
        }

        const batchSuccess = data.results?.filter((r: any) => r.status === "success").length || 0;
        const batchFailed = data.results?.filter((r: any) => r.status !== "success").length || 0;
        totalSuccess += batchSuccess;
        totalFailed += batchFailed;
        totalProcessed += data.processed || 0;

        setMigrationProgress({
          processed: totalProcessed,
          remaining: data.remaining || 0,
          success: totalSuccess,
          failed: totalFailed,
        });

        // If no successes and remaining hasn't changed, move offset forward
        if (batchSuccess === 0) {
          offset += BATCH;
        }

        // Short delay between batches
        await new Promise(r => setTimeout(r, 500));
      }

      toast({
        title: "🚀 Migration complete",
        description: `${totalSuccess} products migrated, ${totalFailed} failed`,
      });
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Migration error", description: err.message, variant: "destructive" });
    } finally {
      setMigrating(false);
    }
  };

  const stopMigration = () => {
    migrationAbortRef.current = true;
  };

  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("products")
        .select("id, name, image_url, category", { count: "exact" })
        .eq("is_active", true)
        .like("image_url", "%desertsdeals.com%")
        .order("name");

      if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, error, count } = await query.range(
        page * PRODUCTS_PER_PAGE,
        (page + 1) * PRODUCTS_PER_PAGE - 1
      );

      if (error) throw error;
      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  // === BULK UPLOAD ===
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) setBulkFiles(prev => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) setBulkFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startBulkUpload = async () => {
    if (bulkFiles.length === 0) return;
    setBulkUploading(true);
    setBulkTotal(bulkFiles.length);
    setBulkDone(0);
    setBulkErrors([]);
    setBulkProgress(0);

    const BATCH_SIZE = 5; // concurrent uploads
    const errors: string[] = [];
    let completed = 0;

    for (let i = 0; i < bulkFiles.length; i += BATCH_SIZE) {
      const batch = bulkFiles.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (file) => {
        try {
          // Sanitize filename: replace special/unicode chars with dashes
          const sanitizedName = file.name
            .replace(/[^\x20-\x7E]/g, '-')  // Remove non-ASCII (™, etc.)
            .replace(/[^a-zA-Z0-9._-]/g, '-') // Keep only safe chars
            .replace(/-+/g, '-')              // Collapse multiple dashes
            .replace(/^-|-$/g, '');           // Trim leading/trailing dashes
          const { error } = await supabase.storage
            .from("product-images")
            .upload(sanitizedName || file.name, file, { contentType: file.type, upsert: true });
          if (error) throw error;
        } catch (err: any) {
          errors.push(`${file.name}: ${err.message}`);
        } finally {
          completed++;
          setBulkDone(completed);
          setBulkProgress(Math.round((completed / bulkFiles.length) * 100));
        }
      });
      await Promise.all(promises);
    }

    setBulkErrors(errors);
    setBulkUploading(false);
    setBulkFiles([]);
    toast({
      title: `✅ Upload complete`,
      description: `${bulkFiles.length - errors.length} uploaded, ${errors.length} failed`,
    });
  };

  // === AUTO-MATCH (runs entirely in frontend, no edge function) ===
  const startAutoMatch = async () => {
    setAutoMatching(true);
    setMatchProgress({ matched: 0, unmatched: 0, total: 0, remaining: totalCount });

    try {
      // Step 1: List ALL files in storage bucket (handle pagination + folders)
      const storageMap = new Map<string, string>(); // lowercase filename -> public URL
      const listAll = async (prefix = "") => {
        const { data, error } = await supabase.storage
          .from("product-images")
          .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
        if (error || !data) return;
        for (const item of data) {
          const path = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.id === null || item.metadata === null) {
            await listAll(path); // folder
          } else {
            const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
            storageMap.set(item.name.toLowerCase(), urlData.publicUrl);
          }
        }
      };
      await listAll();
      console.log(`Storage files found: ${storageMap.size}`);

      // Step 2: Fetch all broken products in batches
      let offset = 0;
      let totalMatched = 0;
      let totalUnmatched = 0;
      const BATCH = 50;

      while (true) {
        const { data: products, error: fetchErr, count } = await supabase
          .from("products")
          .select("id, name, image_url", { count: "exact" })
          .like("image_url", "%desertsdeals.com%")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .range(offset, offset + BATCH - 1);

        if (fetchErr) throw fetchErr;
        if (!products || products.length === 0) break;

        for (const product of products) {
          const urls = (product.image_url || "").split(",").map((u: string) => u.trim()).filter(Boolean);
          const newUrls: string[] = [];
          const seen = new Set<string>();

          for (const url of urls) {
            if (url.includes("supabase")) { newUrls.push(url); continue; }
            const filename = url.split("/").pop()?.split("?")[0]?.toLowerCase();
            if (!filename || seen.has(filename)) continue;
            seen.add(filename);
            const match = storageMap.get(filename);
            if (match) newUrls.push(match);
          }

          if (newUrls.length > 0) {
            const { error: upErr } = await supabase
              .from("products")
              .update({ image_url: newUrls.join(", ") })
              .eq("id", product.id);
            if (!upErr) totalMatched++;
            else totalUnmatched++;
          } else {
            totalUnmatched++;
          }
        }

        const remaining = Math.max(0, (count || 0) - products.length);
        setMatchProgress({ matched: totalMatched, unmatched: totalUnmatched, total: totalMatched + totalUnmatched, remaining });

        if (products.length < BATCH) break;
        // Since matched products change their URL, re-query from offset 0
        // But unmatched ones stay, so if nothing matched we move forward
        if (totalMatched === 0) offset += BATCH;
        else offset = 0; // reset since matched ones drop out
      }

      toast({
        title: "🎯 Auto-match complete",
        description: `${totalMatched} products matched, ${totalUnmatched} still need manual fix`,
      });
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Auto-match error", description: err.message, variant: "destructive" });
    } finally {
      setAutoMatching(false);
    }
  };

  // === INDIVIDUAL PRODUCT ACTIONS ===
  const fetchStorageFiles = async (searchTerm = "") => {
    setStorageLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("product-images")
        .list("", { limit: 100, offset: storagePage * 100, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;

      const allFiles: StorageFile[] = [];
      for (const item of data || []) {
        if (item.id === null || item.metadata === null) {
          const { data: folderFiles } = await supabase.storage
            .from("product-images")
            .list(item.name, { limit: 50 });
          for (const file of folderFiles || []) {
            if (file.metadata) {
              const { data: urlData } = supabase.storage
                .from("product-images")
                .getPublicUrl(`${item.name}/${file.name}`);
              allFiles.push({ name: file.name, url: urlData.publicUrl });
            }
          }
        } else {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(item.name);
          allFiles.push({ name: item.name, url: urlData.publicUrl });
        }
      }

      const filtered = searchTerm
        ? allFiles.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : allFiles;
      setStorageFiles(filtered);
    } catch (err: any) {
      toast({ title: "Error loading storage", description: err.message, variant: "destructive" });
    } finally {
      setStorageLoading(false);
    }
  };

  const openPicker = (product: Product) => {
    setSelectedProduct(product);
    setStoragePage(0);
    setStorageSearch("");
    fetchStorageFiles();
  };

  const assignImage = async (product: Product, imageUrl: string) => {
    setUpdating(product.id);
    try {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session expired");

      const { error } = await supabase.functions.invoke("manage-products", {
        body: {
          action: "update",
          admin_email: session.email,
          admin_token: session.token,
          product: { id: product.id, image_url: imageUrl },
        },
      });
      if (error) throw error;

      toast({ title: "✅ Image updated", description: product.name });
      setSelectedProduct(null);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setTotalCount((prev) => prev - 1);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const handleDirectUpload = async (product: Product, file: File) => {
    setUploadingFor(product.id);
    try {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session expired");

      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `${product.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(storagePath, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(storagePath);

      await assignImage(product, urlData.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingFor(null);
    }
  };

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Fix Product Images</h1>
        <p className="text-muted-foreground mt-1">
          {totalCount} products with broken images.
        </p>
      </div>

      {/* STEP 0: Auto-Migrate from Domain */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <Badge className="text-xs font-semibold bg-primary text-primary-foreground">Migrate</Badge>
          <h2 className="font-semibold text-foreground">Backup Images from Domain</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Downloads all product images from desertsdeals.com and uploads them to your storage bucket. Processes 10 products at a time automatically.
        </p>

        <div className="flex items-center gap-3">
          {!migrating ? (
            <Button onClick={startMigration} className="gap-2">
              <Upload className="w-4 h-4" />
              Start Migration ({totalCount} products)
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopMigration} className="gap-2">
              Stop Migration
            </Button>
          )}
        </div>

        {(migrating || migrationProgress.processed > 0) && (
          <div className="space-y-3">
            <Progress value={migrationProgress.remaining > 0 ? ((migrationProgress.processed) / (migrationProgress.processed + migrationProgress.remaining)) * 100 : 100} className="h-3" />
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-muted rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{migrationProgress.processed}</p>
                <p className="text-[10px] text-muted-foreground">Processed</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-lg font-bold text-green-600">{migrationProgress.success}</p>
                <p className="text-[10px] text-muted-foreground">Success</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-lg font-bold text-red-500">{migrationProgress.failed}</p>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{migrationProgress.remaining}</p>
                <p className="text-[10px] text-muted-foreground">Remaining</p>
              </div>
            </div>
            {migrating && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Migrating... this may take a while
              </p>
            )}
          </div>
        )}
      </div>

      {/* STEP 1: Bulk Upload */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold">Step 1</Badge>
          <h2 className="font-semibold text-foreground">Bulk Upload Images</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Drag & drop all your product images here, or click to select. They'll be uploaded to storage with their original filenames.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <FolderUp className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="font-medium text-foreground">
            {bulkFiles.length > 0
              ? `${bulkFiles.length} images selected`
              : "Drop images here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports JPG, PNG, WebP — select as many as you want
          </p>
        </div>

        {bulkFiles.length > 0 && !bulkUploading && (
          <div className="flex items-center gap-3">
            <Button onClick={startBulkUpload} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload {bulkFiles.length} Images
            </Button>
            <Button variant="ghost" onClick={() => setBulkFiles([])}>Clear</Button>
          </div>
        )}

        {bulkUploading && (
          <div className="space-y-2">
            <Progress value={bulkProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Uploading {bulkDone} / {bulkTotal}...
            </p>
          </div>
        )}

        {bulkErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {bulkErrors.length} upload errors
            </p>
            <div className="max-h-24 overflow-y-auto text-xs text-muted-foreground">
              {bulkErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Auto-Match */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold">Step 2</Badge>
          <h2 className="font-semibold text-foreground">Auto-Match Images</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Automatically match uploaded images to products by comparing filenames in the broken URLs with files in storage.
        </p>

        <Button
          onClick={startAutoMatch}
          disabled={autoMatching}
          className="gap-2"
        >
          {autoMatching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {autoMatching ? "Matching..." : "Run Auto-Match"}
        </Button>

        {(autoMatching || matchProgress.total > 0) && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-500/10 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">{matchProgress.matched}</p>
              <p className="text-xs text-muted-foreground">Matched</p>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3">
              <p className="text-2xl font-bold text-orange-600">{matchProgress.unmatched}</p>
              <p className="text-xs text-muted-foreground">No Match</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-600">{matchProgress.remaining}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: Manual Fix */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold">Step 3</Badge>
          <h2 className="font-semibold text-foreground">Manual Fix (Remaining)</h2>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground">All images are fixed!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border border-border rounded-xl p-4 bg-background space-y-3">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <ImageOff className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm line-clamp-2">{product.name}</p>
                    {product.category && (
                      <Badge variant="secondary" className="mt-1 text-xs">{product.category}</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDirectUpload(product, file);
                        }}
                        disabled={!!uploadingFor}
                      />
                      <Button variant="default" size="sm" className="w-full" asChild disabled={uploadingFor === product.id}>
                        <span>
                          {uploadingFor === product.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                          Upload
                        </span>
                      </Button>
                    </label>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openPicker(product)}>
                      Pick from Storage
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Storage Picker Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick image for: {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={storageSearch}
              onChange={(e) => { setStorageSearch(e.target.value); fetchStorageFiles(e.target.value); }}
              className="pl-10"
            />
          </div>
          {storageLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : storageFiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No images found in storage.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {storageFiles.map((file) => (
                <button
                  key={file.url}
                  onClick={() => selectedProduct && assignImage(selectedProduct, file.url)}
                  disabled={!!updating}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary hover:ring-2 hover:ring-primary/20 transition-all bg-muted"
                >
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                  {updating === selectedProduct?.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">{file.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminImageFix;
