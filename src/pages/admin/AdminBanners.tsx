import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableBannerItem from "@/components/admin/SortableBannerItem";
import type { Banner } from "@/hooks/useBanners";

const ADMIN_SESSION_KEY = "rayn_admin_session";

const POSITIONS = [
  { value: "hero", label: "Hero Slider" },
  { value: "promo", label: "Promo Banner" },
  { value: "promo-grid", label: "Promo Grid" },
  { value: "brand-ad-on", label: "On Cloud Ad" },
  { value: "brand-ad-adidas", label: "Adidas Ad" },
  { value: "brand-ad-nike", label: "Nike Ad" },
];

const getSession = () => {
  try {
    const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored);
    return { email: session.email, token: session.token };
  } catch { return null; }
};

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/shop");
  const [position, setPosition] = useState("hero");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [showButton, setShowButton] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchBanners = async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-banners", {
        body: { action: "list", email: session.email, token: session.token },
      });
      if (error) throw error;
      setBanners(data.banners || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const openCreate = () => {
    setEditBanner(null);
    setTitle("");
    setImageUrl("");
    setLinkUrl("/shop");
    setPosition("hero");
    setSortOrder(0);
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditBanner(b);
    setTitle(b.title);
    setImageUrl(b.image_url);
    setLinkUrl(b.link_url);
    setPosition(b.position);
    setSortOrder(b.sort_order);
    setIsActive(b.is_active);
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(`banners/${fileName}`, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(`banners/${fileName}`);
      setImageUrl(urlData.publicUrl);
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!imageUrl.trim()) {
      toast({ title: "Image required", variant: "destructive" });
      return;
    }
    const session = getSession();
    if (!session) return;
    setSaving(true);
    try {
      const action = editBanner ? "update" : "create";
      const banner = {
        ...(editBanner ? { id: editBanner.id } : {}),
        title, image_url: imageUrl, link_url: linkUrl,
        position, sort_order: sortOrder, is_active: isActive,
      };
      const { error } = await supabase.functions.invoke("manage-banners", {
        body: { action, email: session.email, token: session.token, banner },
      });
      if (error) throw error;
      toast({ title: editBanner ? "Banner updated" : "Banner created" });
      setDialogOpen(false);
      fetchBanners();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    const session = getSession();
    if (!session) return;
    try {
      await supabase.functions.invoke("manage-banners", {
        body: { action: "delete", email: session.email, token: session.token, banner: { id } },
      });
      toast({ title: "Banner deleted" });
      fetchBanners();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent, positionGroup: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const groupItems = banners.filter(b => b.position === positionGroup);
    const oldIndex = groupItems.findIndex(b => b.id === active.id);
    const newIndex = groupItems.findIndex(b => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(groupItems, oldIndex, newIndex);

    // Optimistic update
    const updatedBanners = banners.map(b => {
      if (b.position !== positionGroup) return b;
      const idx = reordered.findIndex(r => r.id === b.id);
      return idx !== -1 ? { ...b, sort_order: idx } : b;
    });
    setBanners(updatedBanners);

    // Persist to backend
    const session = getSession();
    if (!session) return;
    try {
      const updates = reordered.map((b, idx) => ({ id: b.id, sort_order: idx }));
      await supabase.functions.invoke("manage-banners", {
        body: { action: "reorder", email: session.email, token: session.token, updates },
      });
    } catch (err: any) {
      toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
      fetchBanners(); // Rollback
    }
  }, [banners, toast]);

  const groupedBanners = POSITIONS.map(p => ({
    ...p,
    items: banners.filter(b => b.position === p.value).sort((a, b) => a.sort_order - b.sort_order),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banners</h1>
          <p className="text-muted-foreground text-sm">Manage all homepage banners and ads. Drag to reorder.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {groupedBanners.map(group => (
            <div key={group.value} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{group.label}</h2>
              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-4">No banners configured for this position.</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, group.value)}
                >
                  <SortableContext items={group.items.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-2">
                      {group.items.map(b => (
                        <SortableBannerItem
                          key={b.id}
                          banner={b}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBanner ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Banner title" className="mt-1" />
            </div>
            <div>
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Banner Image</Label>
              <div className="mt-1 space-y-2">
                {imageUrl && (
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="Image URL or upload below"
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" type="button" asChild disabled={uploading}>
                      <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}</span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <Label>Link URL</Label>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="/shop" className="mt-1" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="mt-1" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editBanner ? "Update Banner" : "Create Banner"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
