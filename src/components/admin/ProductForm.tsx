import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Upload, Eye, X, Plus, ExternalLink, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from "./RichTextEditor";
import { cn } from "@/lib/utils";

const ALL_SIZES = [
  "EU 36", "EU 37", "EU 38", "EU 39", "EU 40",
  "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46",
  "Free Size",
];

const KIDS_SIZES = [
  "EU 24", "EU 25", "EU 26", "EU 27", "EU 28", "EU 29",
  "EU 30", "EU 31", "EU 32", "EU 33", "EU 34", "EU 35", "EU 36",
];

const JERSEY_SIZES = ["S", "M", "L", "XL", "XXL"];

const FALLBACK_CATEGORIES = [
  { value: "all-shoes", label: "All Shoes" },
  { value: "nike", label: "Nike" },
  { value: "jordan", label: "Jordan" },
  { value: "adidas", label: "Adidas" },
  { value: "new-balance", label: "New Balance" },
  { value: "asics", label: "Asics" },
  { value: "on-cloud", label: "On Cloud" },
  { value: "hoka", label: "Hoka" },
  { value: "puma", label: "Puma" },
  { value: "onitsuka-tiger", label: "Onitsuka Tiger" },
  { value: "loro-piana", label: "Loro Piana" },
  { value: "louis-vuitton", label: "Louis Vuitton" },
  { value: "brooks", label: "Brooks" },
  { value: "hermes", label: "Hermes" },
  { value: "running", label: "Running Shoes" },
  { value: "combo", label: "Combo" },
  { value: "accessories", label: "Accessories" },
];

export interface ProductFormData {
  id: string;
  name: string;
  description: string;
  price: string;
  original_price: string;
  discount_percent: string;
  stock_quantity: string;
  category: string;
  size: string;
  image_url: string;
  is_active: boolean;
  notes_top: string;
  notes_middle: string;
  notes_base: string;
}

export const emptyFormData: ProductFormData = {
  id: "",
  name: "",
  description: "",
  price: "",
  original_price: "",
  discount_percent: "0",
  stock_quantity: "100",
  category: "",
  size: ALL_SIZES.join(", "),
  image_url: "",
  is_active: true,
  notes_top: "",
  notes_middle: "",
  notes_base: "",
};

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  isEditing: boolean;
  isSubmitting: boolean;
  onSubmit: (formData: ProductFormData, pendingImageFiles: File[] | null) => void;
  onCancel: () => void;
}

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
};

const ProductForm = ({
  formData,
  setFormData,
  isEditing,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProductFormProps) => {
  const { toast } = useToast();
  const { data: dbCategories } = useCategories();
  const ALL_CATEGORIES = dbCategories?.length
    ? dbCategories.map(c => ({ value: c.value, label: c.label }))
    : FALLBACK_CATEGORIES;
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState("");
  const [isProductPreviewOpen, setIsProductPreviewOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Track which field the user is actively editing to avoid circular updates
  const lastEditedField = useRef<"discount" | "price" | "original" | null>(null);

  // Auto-calculate final price when original_price or discount_percent changes
  useEffect(() => {
    if (lastEditedField.current === "price") return;
    const origPrice = parseFloat(formData.original_price);
    const discountPct = parseFloat(formData.discount_percent);
    if (!isNaN(origPrice) && origPrice > 0 && !isNaN(discountPct) && discountPct >= 0) {
      const finalPrice = origPrice - (origPrice * discountPct / 100);
      const rounded = Math.round(finalPrice).toString();
      if (formData.price !== rounded) {
        setFormData((prev) => ({ ...prev, price: rounded }));
      }
    }
  }, [formData.original_price, formData.discount_percent]);

  // Auto-calculate discount % when final price or original price changes (and user is editing price)
  useEffect(() => {
    if (lastEditedField.current !== "price" && lastEditedField.current !== "original") return;
    const origPrice = parseFloat(formData.original_price);
    const finalPrice = parseFloat(formData.price);
    if (!isNaN(origPrice) && origPrice > 0 && !isNaN(finalPrice) && finalPrice >= 0) {
      const discPct = ((origPrice - finalPrice) / origPrice) * 100;
      const rounded = Math.max(0, Math.round(discPct)).toString();
      if (formData.discount_percent !== rounded) {
        setFormData((prev) => ({ ...prev, discount_percent: rounded }));
      }
    }
  }, [formData.price, formData.original_price]);

  // Parse existing image_url into previews for editing
  useEffect(() => {
    if (isEditing && formData.image_url && imagePreviews.length === 0 && pendingImageFiles.length === 0) {
      const existingUrls = formData.image_url.split(",").map(u => u.trim()).filter(Boolean);
      setImagePreviews(existingUrls);
    }
  }, [isEditing, formData.image_url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id.trim()) {
      toast({ title: "Error", description: "Product ID is required", variant: "destructive" });
      return;
    }
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast({ title: "Error", description: "Please enter a valid price", variant: "destructive" });
      return;
    }
    if (!formData.original_price || isNaN(parseFloat(formData.original_price)) || parseFloat(formData.original_price) <= 0) {
      toast({ title: "Error", description: "Please enter a valid original price", variant: "destructive" });
      return;
    }

    // Combine all image URLs (existing URLs from previews that aren't blob URLs + pending files handled separately)
    const existingUrls = imagePreviews.filter(url => !url.startsWith("blob:"));
    setFormData(prev => ({ ...prev, image_url: existingUrls.join(", ") }));

    // Pass all pending files for upload
    onSubmit({ ...formData, image_url: existingUrls.join(", ") }, pendingImageFiles.length > 0 ? pendingImageFiles : null);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Error", description: `${file.name} is not an image`, variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: `${file.name} exceeds 5MB limit`, variant: "destructive" });
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setPendingImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const url = imagePreviews[index];
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (url.startsWith("blob:")) {
      const blobPreviews = imagePreviews.filter(u => u.startsWith("blob:"));
      const blobIndex = blobPreviews.indexOf(url);
      if (blobIndex >= 0) {
        setPendingImageFiles(prev => prev.filter((_, i) => i !== blobIndex));
      }
      URL.revokeObjectURL(url);
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder previews
    const newPreviews = [...imagePreviews];
    const [movedPreview] = newPreviews.splice(dragIndex, 1);
    newPreviews.splice(dropIndex, 0, movedPreview);
    setImagePreviews(newPreviews);

    // Reorder pending files to match (map blob URLs to files)
    const blobOrder = newPreviews.filter(u => u.startsWith("blob:"));
    const oldBlobOrder = imagePreviews.filter(u => u.startsWith("blob:"));
    if (blobOrder.length > 0 && oldBlobOrder.length > 0) {
      const oldFiles = [...pendingImageFiles];
      const newFiles = blobOrder.map(blobUrl => {
        const oldIdx = oldBlobOrder.indexOf(blobUrl);
        return oldFiles[oldIdx];
      }).filter(Boolean);
      setPendingImageFiles(newFiles);
    }

    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                  id: isEditing ? prev.id : generateSlug(e.target.value),
                }));
              }}
              placeholder="Nike Air Max 90"
              required
            />
          </div>
          <div>
            <Label htmlFor="id">Product ID (slug)</Label>
            <Input
              id="id"
              value={formData.id}
              onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
              placeholder="nike-air-max-90"
              required
              disabled={isEditing}
            />
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <RichTextEditor
            value={formData.description}
            onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
            placeholder="Premium product with great quality..."
            productId={formData.id}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="original_price">Original Price (AED)</Label>
            <Input
              id="original_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.original_price}
              onFocus={() => { lastEditedField.current = "original"; }}
              onChange={(e) => setFormData((prev) => ({ ...prev, original_price: e.target.value }))}
              placeholder="888"
              required
            />
          </div>
          <div>
            <Label htmlFor="discount_percent">Discount %</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                min={0}
                max={90}
                step={5}
                value={[parseInt(formData.discount_percent) || 0]}
                onValueChange={([val]) => { lastEditedField.current = "discount"; setFormData((prev) => ({ ...prev, discount_percent: val.toString() })); }}
                className="flex-1"
              />
              <Input
                id="discount_percent"
                type="number"
                min="0"
                max="100"
                value={formData.discount_percent}
                onFocus={() => { lastEditedField.current = "discount"; }}
                onChange={(e) => setFormData((prev) => ({ ...prev, discount_percent: e.target.value }))}
                className="w-20 text-center"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="price">Final Price (AED)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="1"
              value={formData.price}
              onFocus={() => { lastEditedField.current = "price"; }}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="Auto-calculated"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="stock_quantity">Stock Quantity</Label>
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            value={formData.stock_quantity}
            onChange={(e) => setFormData((prev) => ({ ...prev, stock_quantity: e.target.value }))}
            placeholder="100"
            required
          />
        </div>

        <div>
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-3 mt-2">
            {ALL_CATEGORIES.map((cat) => {
              const selected = formData.category.split(",").map(s => s.trim()).filter(Boolean);
              const isChecked = selected.includes(cat.value);
              return (
                <label key={cat.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const current = formData.category.split(",").map(s => s.trim()).filter(Boolean);
                      const updated = checked
                        ? [...current, cat.value]
                        : current.filter(s => s !== cat.value);
                      setFormData(prev => ({ ...prev, category: updated.join(", ") }));
                    }}
                  />
                  {cat.label}
                </label>
              );
            })}
          </div>
        </div>
          <div className="col-span-3">
            <Label>Available Sizes</Label>
            {(() => {
              const isJersey = formData.category.toLowerCase().includes("jersey");
              const sizeOptions = isJersey ? JERSEY_SIZES : ALL_SIZES;
              return (
                <>
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <span className="text-xs text-muted-foreground">Quick select:</span>
                    {isJersey ? (
                      <>
                        {[
                          { label: "S–XL", sizes: JERSEY_SIZES.filter(s => ["S","M","L","XL"].includes(s)) },
                          { label: "All", sizes: JERSEY_SIZES },
                          { label: "None", sizes: [] as string[] },
                        ].map((preset) => (
                          <Button key={preset.label} type="button" variant="outline" size="sm" className="h-7 text-xs px-2.5"
                            onClick={() => setFormData(prev => ({ ...prev, size: preset.sizes.join(", ") }))}>{preset.label}</Button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          { label: "36–45", sizes: ALL_SIZES.filter(s => { const n = parseInt(s.replace("EU ", "")); return n >= 36 && n <= 45; }) },
                          { label: "40–45", sizes: ALL_SIZES.filter(s => { const n = parseInt(s.replace("EU ", "")); return n >= 40 && n <= 45; }) },
                          { label: "All", sizes: ALL_SIZES },
                          { label: "None", sizes: [] as string[] },
                        ].map((preset) => (
                          <Button key={preset.label} type="button" variant="outline" size="sm" className="h-7 text-xs px-2.5"
                            onClick={() => setFormData(prev => ({ ...prev, size: preset.sizes.join(", ") }))}>{preset.label}</Button>
                        ))}
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sizeOptions.map((size) => {
                      const selected = formData.size.split(",").map(s => s.trim()).filter(Boolean);
                      const isChecked = selected.includes(size);
                      return (
                        <label key={size} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const current = formData.size.split(",").map(s => s.trim()).filter(Boolean);
                              const updated = checked
                                ? [...current, size]
                                : current.filter(s => s !== size);
                              setFormData(prev => ({ ...prev, size: updated.join(", ") }));
                            }}
                          />
                          {size}
                        </label>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

        {/* Product Images - Multiple */}
        <div className="space-y-3">
          <Label>Product Images</Label>

          {/* Image Grid */}
          {imagePreviews.length > 0 && (
            <>
            <p className="text-xs text-muted-foreground">Drag images to reorder. First image = main product image.</p>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((url, index) => (
                <div
                  key={url + index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  className={cn(
                    "relative w-24 h-24 rounded-lg overflow-hidden border bg-muted group cursor-grab active:cursor-grabbing transition-all",
                    dragIndex === index && "opacity-40 scale-95",
                    dragOverIndex === index && dragIndex !== index && "ring-2 ring-primary"
                  )}
                >
                  <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
                  </div>
                  <img
                    src={url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImageSrc(url);
                        setIsImagePreviewOpen(true);
                      }}
                      className="p-1.5 bg-white/20 rounded-full hover:bg-white/30"
                    >
                      <Eye className="h-3.5 w-3.5 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1.5 bg-white/20 rounded-full hover:bg-white/30"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                  {index === 0 && (
                    <span className="absolute top-1 left-1 text-[9px] bg-primary text-primary-foreground px-1 rounded">
                      Main
                    </span>
                  )}
                </div>
              ))}

              {/* Add more button */}
              <button
                type="button"
                onClick={() => formFileInputRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">Add</span>
              </button>
            </div>
            </>
          )}

          {/* Upload button when no images */}
          {imagePreviews.length === 0 && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => formFileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </div>
          )}

          <input
            type="file"
            ref={formFileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />

          {/* URL input as alternative */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>or enter URLs (comma-separated):</span>
          </div>
          <Input
            id="image_url"
            value={formData.image_url}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, image_url: e.target.value }));
              // Update previews from URL input
              const urls = e.target.value.split(",").map(u => u.trim()).filter(Boolean);
              setImagePreviews(urls);
              setPendingImageFiles([]);
            }}
            placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
          />

          {pendingImageFiles.length > 0 && (
            <p className="text-sm text-muted-foreground">
              📎 {pendingImageFiles.length} image(s) will be uploaded when you save
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
          />
          <Label>Product Active</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsProductPreviewOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </form>

      {/* Image Preview Dialog */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img
              src={previewImageSrc}
              alt="Product preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Preview Dialog */}
      <Dialog open={isProductPreviewOpen} onOpenChange={setIsProductPreviewOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image */}
            <div className="aspect-square w-full bg-muted rounded-lg overflow-hidden">
              {imagePreviews.length > 0 ? (
                <img
                  src={imagePreviews[0]}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No image
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {imagePreviews.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="w-16 h-16 flex-shrink-0 rounded border overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="space-y-2">
              <h2 className="text-xl font-medium">{formData.name || "Product Name"}</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-light">
                  AED {formData.price || "0"}
                </span>
                {formData.original_price && (
                  <span className="text-lg text-muted-foreground line-through">
                    AED {formData.original_price}
                  </span>
                )}
                {parseInt(formData.discount_percent) > 0 && (
                  <span className="text-sm font-medium text-green-600">
                    {formData.discount_percent}% OFF
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-green-600">IN STOCK</span>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {formData.size.split(",").map(s => s.trim()).filter(Boolean).map((size) => (
                  <span
                    key={size}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-xs font-medium"
                  >
                    {size.replace(/^EU\s*/i, "")}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            {formData.description && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Description</p>
                <div
                  className="text-sm text-muted-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.description }}
                />
              </div>
            )}

            {/* Categories */}
            {formData.category && (
              <div className="flex flex-wrap gap-1.5">
                {formData.category.split(",").map(c => c.trim()).filter(Boolean).map(cat => (
                  <span key={cat} className="text-xs bg-muted px-2 py-1 rounded-full capitalize">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductForm;
