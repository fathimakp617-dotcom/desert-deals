import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GripVertical, Plus, Loader2, Trash2, Pencil, Eye, EyeOff, LayoutTemplate, ShoppingBag, ImageIcon, Type, Rows3, Monitor, PanelLeft, ArrowUp, ArrowDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ADMIN_SESSION_KEY = "rayn_admin_session";

interface SectionConfig {
  type?: string;
  brand?: string;
  shop_link?: string;
  image_url?: string;
  images?: string[];
  link_url?: string;
  heading?: string;
  description?: string;
  button_text?: string;
  button_link?: string;
  category?: string;
  limit?: number;
  show_button?: boolean;
}

interface PageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  is_visible: boolean;
  sort_order: number;
  section_type: string;
  config: SectionConfig;
}

const SECTION_TYPES = [
  { value: "product_row", label: "Product Row", icon: ShoppingBag, desc: "Scrollable row of products by brand/category" },
  { value: "banner", label: "Banner / Ad", icon: ImageIcon, desc: "Full-width image banner with link" },
  { value: "text_block", label: "Text / CTA Block", icon: Type, desc: "Heading, description, and call-to-action" },
];

const getSession = (): { email: string; token: string } | null => {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return { email: s.email, token: s.token };
  } catch { return null; }
};

const typeIcon = (type: string) => {
  switch (type) {
    case "product_row": return <ShoppingBag className="h-4 w-4" />;
    case "banner": return <ImageIcon className="h-4 w-4" />;
    case "text_block": return <Type className="h-4 w-4" />;
    default: return <Rows3 className="h-4 w-4" />;
  }
};

const typeLabel = (type: string) => {
  const t = SECTION_TYPES.find(s => s.value === type);
  return t?.label || type;
};

// ─── Sortable card ───
const SortableSectionCard = ({ section, onEdit, onToggle, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  section: PageSection;
  onEdit: (s: PageSection) => void;
  onToggle: (s: PageSection) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const config = section.config || {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 bg-card border rounded-lg p-4 transition-shadow ${
        isDragging ? "shadow-xl ring-2 ring-primary border-primary" : "border-border hover:shadow-md"
      } ${!section.is_visible ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none p-1.5 rounded hover:bg-muted"
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <button onClick={() => onMoveUp(section.id)} disabled={isFirst} className="p-0.5 rounded hover:bg-muted disabled:opacity-30" title="Move up">
          <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => onMoveDown(section.id)} disabled={isLast} className="p-0.5 rounded hover:bg-muted disabled:opacity-30" title="Move down">
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground">{typeIcon(section.section_type)}</span>
          <span className="font-medium text-sm truncate">{section.title || "Untitled"}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{typeLabel(section.section_type)}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${section.is_visible ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
            {section.is_visible ? "Visible" : "Hidden"}
          </span>
        </div>
        {section.subtitle && <p className="text-xs text-muted-foreground truncate">{section.subtitle}</p>}
        {/* Inline preview for all section types */}
        <div className="mt-1">
          <SectionPreview section={section} />
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onToggle(section)} className="p-1.5 rounded hover:bg-muted" title={section.is_visible ? "Hide" : "Show"}>
          {section.is_visible ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </button>
        <Button size="icon" variant="ghost" onClick={() => onEdit(section)}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(section.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

// Drag overlay card (shown while dragging)
const DragOverlayCard = ({ section }: { section: PageSection }) => (
  <div className="flex items-center gap-3 bg-card border-2 border-primary rounded-lg p-4 shadow-2xl opacity-90">
    <GripVertical className="h-5 w-5 text-primary shrink-0" />
    <span className="text-muted-foreground">{typeIcon(section.section_type)}</span>
    <span className="font-medium text-sm">{section.title || "Untitled"}</span>
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-auto">{typeLabel(section.section_type)}</span>
  </div>
);

// ─── Preview components ───
const PreviewProductRow = ({ section }: { section: PageSection }) => (
  <div className="border border-dashed border-border rounded-lg p-4 bg-muted/30">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-heading font-bold text-foreground">{section.title}</h3>
      {section.config?.shop_link && (
        <span className="text-xs text-primary">View All →</span>
      )}
    </div>
    <div className="flex gap-3 overflow-hidden">
      {[1,2,3,4].map(i => (
        <div key={i} className="w-[140px] shrink-0 space-y-2">
          <div className="w-full h-[140px] rounded-lg bg-muted animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
    <p className="text-[10px] text-muted-foreground mt-2">Brand: {section.config?.brand || "—"}</p>
  </div>
);

const PreviewBanner = ({ section }: { section: PageSection }) => {
  const images = section.config?.images || (section.config?.image_url ? [section.config.image_url] : []);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % images.length), 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="rounded-lg overflow-hidden relative bg-muted">
      {images.length > 0 ? (
        <div className="relative">
          <img src={images[currentSlide] || images[0]} alt={section.title} className="w-full h-[120px] sm:h-[180px] object-cover transition-opacity duration-500" />
          {images.length > 1 && (
            <div className="absolute bottom-8 right-4 flex gap-1">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? "bg-foreground" : "bg-foreground/40"}`} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-[120px] sm:h-[180px] flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="absolute bottom-4 left-4">
        <span className="bg-foreground text-background text-xs px-4 py-1.5 rounded-full">
          {section.config?.button_text || "Shop Now →"}
        </span>
      </div>
    </div>
  );
};

const PreviewTextBlock = ({ section }: { section: PageSection }) => (
  <div className="rounded-lg border border-dashed border-border p-6 text-center bg-muted/20">
    {section.config?.heading && <h3 className="text-lg font-heading font-bold text-foreground mb-1">{section.config.heading}</h3>}
    {section.config?.description && <p className="text-sm text-muted-foreground mb-3">{section.config.description}</p>}
    {section.config?.button_text && (
      <span className="inline-block bg-foreground text-background text-xs px-5 py-2 rounded-full">
        {section.config.button_text}
      </span>
    )}
  </div>
);

const isBuiltInBanner = (key: string) => /_ad$|_ad_|banner|promo/.test(key);
const isBuiltInProductRow = (key: string) => /_collection$/.test(key);

const PreviewBuiltIn = ({ section }: { section: PageSection }) => {
  const config = section.config || {};
  // If it has images or image_url, show banner preview
  if (config.image_url || (config.images && config.images.length > 0)) {
    return <PreviewBanner section={section} />;
  }
  if (config.brand) {
    return <PreviewProductRow section={section} />;
  }
  return (
    <div className="border border-dashed border-border rounded-lg p-4 bg-muted/20 flex items-center gap-3">
      <Rows3 className="h-5 w-5 text-muted-foreground shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">{section.title}</p>
        <p className="text-xs text-muted-foreground">Built-in section</p>
      </div>
    </div>
  );
};

const SectionPreview = ({ section }: { section: PageSection }) => {
  switch (section.section_type) {
    case "product_row": return <PreviewProductRow section={section} />;
    case "banner": return <PreviewBanner section={section} />;
    case "text_block": return <PreviewTextBlock section={section} />;
    default: return <PreviewBuiltIn section={section} />;
  }
};

// ─── Config forms ───
const ProductRowConfig = ({ config, onChange }: { config: SectionConfig; onChange: (c: SectionConfig) => void }) => (
  <div className="space-y-3">
    <div>
      <label className="text-sm font-medium">Brand Filter</label>
      <Input placeholder="e.g. nike, adidas, on" value={config.brand || ""} onChange={e => onChange({ ...config, brand: e.target.value })} />
      <p className="text-xs text-muted-foreground mt-1">Products matching this brand name will be shown</p>
    </div>
    <div>
      <label className="text-sm font-medium">Category Filter (optional)</label>
      <Input placeholder="e.g. sneakers" value={config.category || ""} onChange={e => onChange({ ...config, category: e.target.value })} />
    </div>
    <div>
      <label className="text-sm font-medium">Shop Link</label>
      <Input placeholder="/shop?brand=nike" value={config.shop_link || ""} onChange={e => onChange({ ...config, shop_link: e.target.value })} />
    </div>
    <div>
      <label className="text-sm font-medium">Max Products</label>
      <Input type="number" placeholder="20" value={config.limit || ""} onChange={e => onChange({ ...config, limit: parseInt(e.target.value) || undefined })} />
    </div>
  </div>
);

const BannerConfig = ({ config, onChange }: { config: SectionConfig; onChange: (c: SectionConfig) => void }) => {
  const images = config.images || (config.image_url ? [config.image_url] : []);

  const handleUpload = async (files: FileList) => {
    const newImages = [...images];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) continue;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      newImages.push(urlData.publicUrl);
    }
    onChange({ ...config, images: newImages, image_url: newImages[0] || "" });
  };

  const removeImage = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    onChange({ ...config, images: updated, image_url: updated[0] || "" });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Banner Images</label>
        <p className="text-xs text-muted-foreground mb-2">Upload multiple images to create a slider. Single image = static banner.</p>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={e => { if (e.target.files?.length) handleUpload(e.target.files); }}
        />
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden bg-muted h-20">
              <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <span className="absolute bottom-1 left-1 bg-foreground/70 text-background text-[10px] px-1.5 rounded">{idx + 1}</span>
            </div>
          ))}
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Or Paste Image URL</label>
        <div className="flex gap-2">
          <Input
            placeholder="https://..."
            onKeyDown={e => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) {
                  const updated = [...images, val];
                  onChange({ ...config, images: updated, image_url: updated[0] || "" });
                  (e.target as HTMLInputElement).value = "";
                }
                e.preventDefault();
              }
            }}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Link URL</label>
        <Input placeholder="/shop?brand=nike" value={config.link_url || ""} onChange={e => onChange({ ...config, link_url: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium">Button Text (only shown if button enabled)</label>
        <Input placeholder="Shop Now →" value={config.button_text || ""} onChange={e => onChange({ ...config, button_text: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={config.show_button === true} onCheckedChange={v => onChange({ ...config, show_button: v })} />
        <label className="text-sm font-medium">Show Button on Banner</label>
      </div>
    </div>
  );
};

const TextBlockConfig = ({ config, onChange }: { config: SectionConfig; onChange: (c: SectionConfig) => void }) => (
  <div className="space-y-3">
    <div>
      <label className="text-sm font-medium">Heading</label>
      <Input placeholder="Summer Collection" value={config.heading || ""} onChange={e => onChange({ ...config, heading: e.target.value })} />
    </div>
    <div>
      <label className="text-sm font-medium">Description</label>
      <Textarea placeholder="Explore our latest collection..." value={config.description || ""} onChange={e => onChange({ ...config, description: e.target.value })} rows={3} />
    </div>
    <div>
      <label className="text-sm font-medium">Button Text</label>
      <Input placeholder="Shop Now" value={config.button_text || ""} onChange={e => onChange({ ...config, button_text: e.target.value })} />
    </div>
    <div>
      <label className="text-sm font-medium">Button Link</label>
      <Input placeholder="/shop" value={config.button_link || ""} onChange={e => onChange({ ...config, button_link: e.target.value })} />
    </div>
  </div>
);

// ─── Main Component ───
const AdminPageBuilder = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"builder" | "preview">("builder");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formType, setFormType] = useState("product_row");
  const [formConfig, setFormConfig] = useState<SectionConfig>({});
  const [formVisible, setFormVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchSections = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-homepage-sections", {
        body: { action: "list", email: session.email, token: session.token },
      });
      if (error) throw error;
      setSections((data.sections || []) as PageSection[]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const openCreate = () => {
    setEditingSection(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormType("product_row");
    setFormConfig({});
    setFormVisible(true);
    setDialogOpen(true);
  };

  const openEdit = (section: PageSection) => {
    setEditingSection(section);
    setFormTitle(section.title);
    setFormSubtitle(section.subtitle);
    setFormType(section.section_type);
    setFormConfig(section.config || {});
    setFormVisible(section.is_visible);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const session = getSession();
    if (!session) return;
    if (!formTitle.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingSection) {
        await supabase.functions.invoke("manage-homepage-sections", {
          body: {
            action: "update",
            email: session.email,
            token: session.token,
            section: {
              id: editingSection.id,
              title: formTitle,
              subtitle: formSubtitle,
              is_visible: formVisible,
              sort_order: editingSection.sort_order,
              config: formConfig,
            },
          },
        });
        toast({ title: "Section updated" });
      } else {
        const key = formTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
        await supabase.functions.invoke("manage-homepage-sections", {
          body: {
            action: "create",
            email: session.email,
            token: session.token,
            section: {
              section_key: `custom_${key}_${Date.now()}`,
              title: formTitle,
              subtitle: formSubtitle,
              is_visible: formVisible,
              sort_order: sections.length + 1,
              section_type: formType,
              config: formConfig,
            },
          },
        });
        toast({ title: "Section created" });
      }
      setDialogOpen(false);
      fetchSections();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (section: PageSection) => {
    const session = getSession();
    if (!session) return;
    const updated = { ...section, is_visible: !section.is_visible };
    setSections(prev => prev.map(s => s.id === section.id ? updated : s));
    try {
      await supabase.functions.invoke("manage-homepage-sections", {
        body: { action: "update", email: session.email, token: session.token, section: updated },
      });
    } catch {
      setSections(prev => prev.map(s => s.id === section.id ? section : s));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const session = getSession();
    if (!session) return;
    try {
      await supabase.functions.invoke("manage-homepage-sections", {
        body: { action: "delete", email: session.email, token: session.token, section: { id: deleteId } },
      });
      toast({ title: "Section deleted" });
      setDeleteId(null);
      fetchSections();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const reorderAndSave = async (reordered: PageSection[]) => {
    const withOrder = reordered.map((s, i) => ({ ...s, sort_order: i + 1 }));
    setSections(withOrder);
    const session = getSession();
    if (!session) return;
    try {
      await supabase.functions.invoke("manage-homepage-sections", {
        body: {
          action: "reorder",
          email: session.email,
          token: session.token,
          updates: withOrder.map(s => ({ id: s.id, sort_order: s.sort_order })),
        },
      });
    } catch {
      fetchSections();
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex(s => s.id === active.id);
    const newIdx = sections.findIndex(s => s.id === over.id);
    await reorderAndSave(arrayMove(sections, oldIdx, newIdx));
  };

  const handleMoveUp = (id: string) => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx <= 0) return;
    reorderAndSave(arrayMove(sections, idx, idx - 1));
  };

  const handleMoveDown = (id: string) => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0 || idx >= sections.length - 1) return;
    reorderAndSave(arrayMove(sections, idx, idx + 1));
  };

  const activeSection = activeId ? sections.find(s => s.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-heading font-bold">Page Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("builder")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "builder" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <PanelLeft className="h-3.5 w-3.5 inline mr-1" />
              Builder
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Monitor className="h-3.5 w-3.5 inline mr-1" />
              Preview
            </button>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {viewMode === "builder"
          ? "Drag cards or use arrows to reorder. Toggle visibility and edit configuration."
          : "Preview how sections will appear on the homepage."}
      </p>

      {/* ─── Builder View ─── */}
      {viewMode === "builder" && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <LayoutTemplate className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No sections yet. Click "Add Section" to start building.</p>
                </div>
              ) : (
                sections.map((section, idx) => (
                  <SortableSectionCard
                    key={section.id}
                    section={section}
                    onEdit={openEdit}
                    onToggle={handleToggle}
                    onDelete={id => setDeleteId(id)}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isFirst={idx === 0}
                    isLast={idx === sections.length - 1}
                  />
                ))
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeSection ? <DragOverlayCard section={activeSection} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ─── Preview View ─── */}
      {viewMode === "preview" && (
        <div className="border border-border rounded-xl bg-background overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">Homepage Preview</span>
          </div>
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {sections.filter(s => s.is_visible).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No visible sections to preview.</p>
            ) : (
              sections.filter(s => s.is_visible).map(section => (
                <div key={section.id}>
                  <SectionPreview section={section} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add New Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Section Title</label>
              <Input placeholder="e.g. Nike Collection" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Subtitle / Description</label>
              <Input placeholder="Brief description" value={formSubtitle} onChange={e => setFormSubtitle(e.target.value)} />
            </div>

            {!editingSection && (
              <div>
                <label className="text-sm font-medium">Section Type</label>
                <Select value={formType} onValueChange={v => { setFormType(v); setFormConfig({}); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block">Configuration</label>
              {(editingSection?.section_type || formType) === "product_row" && <ProductRowConfig config={formConfig} onChange={setFormConfig} />}
              {(editingSection?.section_type || formType) === "banner" && <BannerConfig config={formConfig} onChange={setFormConfig} />}
              {(editingSection?.section_type || formType) === "text_block" && <TextBlockConfig config={formConfig} onChange={setFormConfig} />}
              {!["product_row", "banner", "text_block"].includes(editingSection?.section_type || formType) && (
                editingSection && (isBuiltInBanner(editingSection.section_key) || isBuiltInBanner(editingSection.title.toLowerCase())) ? (
                  <BannerConfig config={formConfig} onChange={setFormConfig} />
                ) : editingSection && isBuiltInProductRow(editingSection.section_key) ? (
                  <ProductRowConfig config={formConfig} onChange={setFormConfig} />
                ) : (
                  <p className="text-sm text-muted-foreground">Built-in section — only title and visibility can be changed.</p>
                )
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={formVisible} onCheckedChange={setFormVisible} />
                <span className="text-sm">Visible on homepage</span>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingSection ? "Save Changes" : "Create Section"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this section from the homepage.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPageBuilder;
