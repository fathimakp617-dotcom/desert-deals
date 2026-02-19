import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Upload, Image, Search, ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ProductForm, { emptyFormData, type ProductFormData } from "@/components/admin/ProductForm";

interface Product {
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
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

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

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEditField, setBulkEditField] = useState<string>("");
  const [bulkEditValue, setBulkEditValue] = useState<string>("");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "list", admin_email: session.email, admin_token: session.token },
      });

      if (error) throw error;
      return data.products as Product[];
    },
  });

  // Derive categories from products
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  // Filtered & searched products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
      );
    }

    if (stockFilter === "instock") result = result.filter((p) => p.stock_quantity > 0);
    else if (stockFilter === "outofstock") result = result.filter((p) => p.stock_quantity === 0);
    else if (stockFilter === "lowstock") result = result.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 10);

    if (categoryFilter !== "all") result = result.filter((p) => p.category === categoryFilter);

    if (statusFilter === "active") result = result.filter((p) => p.is_active);
    else if (statusFilter === "inactive") result = result.filter((p) => !p.is_active);

    return result;
  }, [products, searchQuery, stockFilter, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  // ... keep existing code (uploadImageMutation, buildProductPayload, createMutation, updateMutation, deleteMutation, updateStockMutation, openEditDialog, handleFormSubmit, handleCancel, handleImageUpload)
  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: {
          action: "upload_image",
          admin_email: session.email,
          admin_token: session.token,
          imageData: {
            base64,
            fileName: file.name,
            contentType: file.type,
            productId,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Image uploaded successfully" });
      setUploadingFor(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setUploadingFor(null);
    },
  });

  const buildProductPayload = (fd: ProductFormData) => ({
    id: fd.id.trim(),
    name: fd.name.trim(),
    description: fd.description.trim(),
    price: parseFloat(fd.price) || 0,
    original_price: parseFloat(fd.original_price) || 0,
    discount_percent: parseInt(fd.discount_percent) || 0,
    stock_quantity: parseInt(fd.stock_quantity) || 0,
    category: fd.category,
    size: fd.size,
    image_url: fd.image_url.trim(),
    is_active: fd.is_active,
    notes: {
      top: fd.notes_top.split(",").map((n) => n.trim()).filter(Boolean),
      middle: fd.notes_middle.split(",").map((n) => n.trim()).filter(Boolean),
      base: fd.notes_base.split(",").map((n) => n.trim()).filter(Boolean),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (fd: ProductFormData) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "create", product: buildProductPayload(fd), admin_email: session.email, admin_token: session.token },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsAddDialogOpen(false);
      setFormData(emptyFormData);
      toast({ title: "Product created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating product", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (fd: ProductFormData) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "update", product: buildProductPayload(fd), admin_email: session.email, admin_token: session.token },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEditingProduct(null);
      setFormData(emptyFormData);
      toast({ title: "Product updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating product", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "delete", product: { id: productId }, admin_email: session.email, admin_token: session.token },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock_quantity }: { id: string; stock_quantity: number }) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "update_stock", product: { id, stock_quantity }, admin_email: session.email, admin_token: session.token },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Stock updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, updates }: { productIds: string[]; updates: Record<string, unknown> }) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "bulk_update", product_ids: productIds, updates, admin_email: session.email, admin_token: session.token },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setSelectedIds(new Set());
      setIsBulkDialogOpen(false);
      setBulkEditField("");
      setBulkEditValue("");
      toast({ title: `${data.updated} products updated` });
    },
    onError: (error: Error) => {
      toast({ title: "Bulk update failed", description: error.message, variant: "destructive" });
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const handleBulkEdit = () => {
    if (!bulkEditField || !bulkEditValue.trim()) return;
    const updates: Record<string, unknown> = {};
    if (bulkEditField === "size") updates.size = bulkEditValue.trim();
    if (bulkEditField === "category") updates.category = bulkEditValue.trim();
    if (bulkEditField === "is_active") updates.is_active = bulkEditValue === "true";
    if (bulkEditField === "discount_percent") updates.discount_percent = parseInt(bulkEditValue) || 0;
    bulkUpdateMutation.mutate({ productIds: Array.from(selectedIds), updates });
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      discount_percent: product.discount_percent?.toString() || "0",
      stock_quantity: product.stock_quantity.toString(),
      category: product.category || "sneakers",
      size: product.size || "EU 40-45",
      image_url: product.image_url || "",
      is_active: product.is_active,
      notes_top: product.notes?.top?.join(", ") || "",
      notes_middle: product.notes?.middle?.join(", ") || "",
      notes_base: product.notes?.base?.join(", ") || "",
    });
  };

  const handleFormSubmit = (fd: ProductFormData, pendingImageFile: File | null) => {
    const productId = editingProduct ? editingProduct.id : fd.id;

    const afterSuccess = () => {
      if (pendingImageFile && productId) {
        uploadImageMutation.mutate({ productId, file: pendingImageFile });
      }
    };

    if (editingProduct) {
      updateMutation.mutate(fd, { onSuccess: afterSuccess });
    } else {
      createMutation.mutate(fd, { onSuccess: afterSuccess });
    }
  };

  const handleCancel = () => {
    setIsAddDialogOpen(false);
    setEditingProduct(null);
    setFormData(emptyFormData);
  };

  const handleImageUpload = (productId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }
    setUploadingFor(productId);
    uploadImageMutation.mutate({ productId, file });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = products?.filter((p) => p.is_active).length || 0;
  const inactiveCount = products?.filter((p) => !p.is_active).length || 0;

  return (
    <div className="space-y-4">
      {/* Hidden file input for table image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingFor) {
            handleImageUpload(uploadingFor, file);
          }
          e.target.value = "";
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Products</h1>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setFormData(emptyFormData);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setFormData(emptyFormData)}>
              <Plus className="mr-2 h-4 w-4" />
              Add new product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              formData={formData}
              setFormData={setFormData}
              isEditing={false}
              isSubmitting={createMutation.isPending || uploadImageMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProduct(null);
            setFormData(emptyFormData);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            isEditing={true}
            isSubmitting={updateMutation.isPending || uploadImageMutation.isPending}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Status tabs */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <button
          onClick={() => handleFilterChange(setStatusFilter)("all")}
          className={`hover:text-foreground transition-colors ${statusFilter === "all" ? "text-foreground font-medium" : ""}`}
        >
          All ({products?.length || 0})
        </button>
        <span>|</span>
        <button
          onClick={() => handleFilterChange(setStatusFilter)("active")}
          className={`hover:text-foreground transition-colors ${statusFilter === "active" ? "text-foreground font-medium" : ""}`}
        >
          Active ({activeCount})
        </button>
        <span>|</span>
        <button
          onClick={() => handleFilterChange(setStatusFilter)("inactive")}
          className={`hover:text-foreground transition-colors ${statusFilter === "inactive" ? "text-foreground font-medium" : ""}`}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={categoryFilter} onValueChange={handleFilterChange(setCategoryFilter)}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={handleFilterChange(setStockFilter)}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="Filter by stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock</SelectItem>
            <SelectItem value="instock">In stock</SelectItem>
            <SelectItem value="outofstock">Out of stock</SelectItem>
            <SelectItem value="lowstock">Low stock</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{filteredProducts.length} items</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9 w-[200px] text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/50">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Select value={bulkEditField} onValueChange={(v) => { setBulkEditField(v); setBulkEditValue(""); }}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Edit field..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="is_active">Status</SelectItem>
              <SelectItem value="discount_percent">Discount %</SelectItem>
            </SelectContent>
          </Select>
          {bulkEditField === "is_active" ? (
            <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="Status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          ) : bulkEditField === "category" ? (
            <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
              <SelectTrigger className="w-[160px] h-8 text-sm">
                <SelectValue placeholder="Category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : bulkEditField ? (
            <Input
              placeholder={bulkEditField === "size" ? "e.g. EU 36-45" : "e.g. 10"}
              value={bulkEditValue}
              onChange={(e) => setBulkEditValue(e.target.value)}
              className="w-[160px] h-8 text-sm"
            />
          ) : null}
          <Button
            size="sm"
            disabled={!bulkEditField || !bulkEditValue.trim() || bulkUpdateMutation.isPending}
            onClick={handleBulkEdit}
          >
            {bulkUpdateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Apply
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={paginatedProducts.length > 0 && selectedIds.size === paginatedProducts.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product) => (
              <TableRow key={product.id} className="group">
                {/* Checkbox */}
                <TableCell className="py-2">
                  <Checkbox
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={() => toggleSelect(product.id)}
                  />
                </TableCell>
                {/* Image */}
                <TableCell className="py-2">
                  <div className="relative">
                    {product.image_url ? (
                      <div className="relative h-12 w-12 rounded overflow-hidden">
                        <img
                          src={product.image_url.split(",")[0]?.trim()}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() => {
                            setUploadingFor(product.id);
                            fileInputRef.current?.click();
                          }}
                          className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          {uploadingFor === product.id && uploadImageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 text-background animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 text-background" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setUploadingFor(product.id);
                          fileInputRef.current?.click();
                        }}
                        className="h-12 w-12 rounded bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      >
                        {uploadingFor === product.id && uploadImageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        ) : (
                          <Image className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                </TableCell>

                {/* Name */}
                <TableCell className="py-2">
                  <button
                    onClick={() => openEditDialog(product)}
                    className="text-sm font-medium text-primary hover:underline text-left"
                  >
                    {product.name}
                  </button>
                  <div className="text-xs text-muted-foreground mt-0.5">ID: {product.id}</div>
                  <div className="hidden group-hover:flex items-center gap-2 mt-1 text-xs">
                    <button onClick={() => openEditDialog(product)} className="text-primary hover:underline">Edit</button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this product?")) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                      className="text-destructive hover:underline"
                    >
                      Trash
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a>
                  </div>
                </TableCell>

                {/* Stock */}
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    {product.stock_quantity > 10 ? (
                      <span className="text-sm font-medium text-green-600">In stock</span>
                    ) : product.stock_quantity > 0 ? (
                      <span className="text-sm font-medium text-orange-600">Low stock ({product.stock_quantity})</span>
                    ) : (
                      <span className="text-sm font-medium text-destructive">Out of stock</span>
                    )}
                    <Input
                      type="number"
                      defaultValue={product.stock_quantity}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        if (newValue !== product.stock_quantity) {
                          updateStockMutation.mutate({ id: product.id, stock_quantity: newValue });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      className="w-16 h-7 text-xs"
                    />
                  </div>
                </TableCell>

                {/* Price */}
                <TableCell className="py-2">
                  {product.original_price > 0 && product.original_price !== product.price && (
                    <span className="text-xs text-muted-foreground line-through block">{product.original_price} AED</span>
                  )}
                  <span className="text-sm font-medium">{product.price} AED</span>
                </TableCell>

                {/* Categories */}
                <TableCell className="py-2">
                  <span className="text-sm capitalize">{product.category || "—"}</span>
                </TableCell>

                {/* Date */}
                <TableCell className="py-2">
                  <div className="text-sm">
                    {product.is_active ? "Published" : "Draft"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(product.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right py-2">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(product)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this product?")) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery || stockFilter !== "all" || categoryFilter !== "all"
                    ? "No products match your filters."
                    : "No products found. Add your first product!"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
