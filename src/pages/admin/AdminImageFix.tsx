import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ImageOff, Check, Upload, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
  const { toast } = useToast();

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

  // Fetch products with broken images
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

  // Fetch files from storage bucket
  const fetchStorageFiles = async (searchTerm = "") => {
    setStorageLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("product-images")
        .list("", { limit: 100, offset: storagePage * 100, sortBy: { column: "name", order: "asc" } });

      if (error) throw error;

      // Also list files inside folders (product ID folders)
      const allFiles: StorageFile[] = [];

      for (const item of data || []) {
        if (item.id === null || item.metadata === null) {
          // It's a folder, list its contents
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

  // Open picker dialog
  const openPicker = (product: Product) => {
    setSelectedProduct(product);
    setStoragePage(0);
    setStorageSearch("");
    fetchStorageFiles();
  };

  // Assign image from storage
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
      // Remove from list
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setTotalCount((prev) => prev - 1);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  // Direct upload for a product
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
          {totalCount} products with broken images. Upload or pick the correct image for each.
        </p>
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-foreground">All images are fixed!</p>
          <p className="text-muted-foreground">No more products with broken images.</p>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-border rounded-xl p-4 bg-card space-y-3"
              >
                {/* Broken image placeholder */}
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
                  {/* Direct upload button */}
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
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      asChild
                      disabled={uploadingFor === product.id}
                    >
                      <span>
                        {uploadingFor === product.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3 mr-1" />
                        )}
                        Upload
                      </span>
                    </Button>
                  </label>

                  {/* Pick from storage */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openPicker(product)}
                  >
                    Pick from Storage
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Storage Picker Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Pick image for: {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={storageSearch}
              onChange={(e) => {
                setStorageSearch(e.target.value);
                fetchStorageFiles(e.target.value);
              }}
              className="pl-10"
            />
          </div>

          {storageLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : storageFiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              No images found in storage. Upload images to the product-images bucket first.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {storageFiles.map((file) => (
                <button
                  key={file.url}
                  onClick={() => selectedProduct && assignImage(selectedProduct, file.url)}
                  disabled={!!updating}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary hover:ring-2 hover:ring-primary/20 transition-all bg-muted"
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
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
