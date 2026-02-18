import { useState, useRef, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, Eye, X, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_SIZES = [
  "EU 36", "EU 37", "EU 38", "EU 39", "EU 40",
  "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46",
  "Free Size",
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
  category: "sneakers",
  size: "",
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
  onSubmit: (formData: ProductFormData, pendingImageFile: File | null) => void;
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
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState("");

  // Auto-calculate final price when original_price or discount_percent changes
  useEffect(() => {
    const origPrice = parseFloat(formData.original_price);
    const discountPct = parseFloat(formData.discount_percent);
    if (!isNaN(origPrice) && origPrice > 0 && !isNaN(discountPct) && discountPct >= 0) {
      const finalPrice = origPrice - (origPrice * discountPct / 100);
      setFormData((prev) => ({ ...prev, price: Math.round(finalPrice).toString() }));
    }
  }, [formData.original_price, formData.discount_percent]);

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

    // Pass the first pending file for upload (the edge function handles one at a time)
    onSubmit({ ...formData, image_url: existingUrls.join(", ") }, pendingImageFiles[0] || null);
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
      // Find corresponding pending file index (blob previews come after existing URLs)
      const blobPreviews = imagePreviews.filter(u => u.startsWith("blob:"));
      const blobIndex = blobPreviews.indexOf(url);
      if (blobIndex >= 0) {
        setPendingImageFiles(prev => prev.filter((_, i) => i !== blobIndex));
      }
      URL.revokeObjectURL(url);
    }
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
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Premium product with great quality..."
            rows={3}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, original_price: e.target.value }))}
              placeholder="888"
              required
            />
          </div>
          <div>
            <Label htmlFor="discount_percent">Discount %</Label>
            <Input
              id="discount_percent"
              type="number"
              min="0"
              max="100"
              value={formData.discount_percent}
              onChange={(e) => setFormData((prev) => ({ ...prev, discount_percent: e.target.value }))}
              placeholder="50"
            />
          </div>
          <div>
            <Label htmlFor="price">Final Price (AED)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              className="bg-muted/50"
              readOnly
              placeholder="Auto-calculated"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sneakers">Sneakers</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="loafers">Loafers</SelectItem>
                <SelectItem value="slides">Slides</SelectItem>
                <SelectItem value="boots">Boots</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="combo">Combo</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <Label>Available Sizes</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {ALL_SIZES.map((size) => {
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
          </div>
        </div>

        {/* Product Images - Multiple */}
        <div className="space-y-3">
          <Label>Product Images</Label>

          {/* Image Grid */}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((url, index) => (
                <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted group">
                  <img
                    src={url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
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
    </>
  );
};

export default ProductForm;
