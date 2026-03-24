import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Loader2, GripVertical, Plus, Eye, EyeOff, Layout } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ADMIN_SESSION_KEY = "rayn_admin_session";

interface HomepageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  is_visible: boolean;
  sort_order: number;
  section_type: string;
  config: Record<string, unknown>;
}

const getSession = (): { email: string; token: string } | null => {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return { email: s.email, token: s.token };
  } catch { return null; }
};

const SortableRow = ({ section, onEdit, onToggle, onDelete }: {
  section: HomepageSection;
  onEdit: (s: HomepageSection) => void;
  onToggle: (s: HomepageSection) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="py-2 w-[40px]">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="py-2">
        <span className="text-sm font-medium">{section.title}</span>
        <div className="text-xs text-muted-foreground">{section.section_key}</div>
      </TableCell>
      <TableCell className="py-2">
        <span className="text-xs text-muted-foreground">{section.subtitle}</span>
      </TableCell>
      <TableCell className="py-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${section.section_type === "built_in" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
          {section.section_type === "built_in" ? "Built-in" : "Custom"}
        </span>
      </TableCell>
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={section.is_visible}
            onCheckedChange={() => onToggle(section)}
          />
          {section.is_visible ? (
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </TableCell>
      <TableCell className="text-right py-2">
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" onClick={() => onEdit(section)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {section.section_type !== "built_in" && (
            <Button size="sm" variant="destructive" onClick={() => onDelete(section.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminSections = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", subtitle: "", section_key: "" });
  const [configData, setConfigData] = useState({ badge_text: "", sub_text: "", emoji: "📢" });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchSections = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-homepage-sections", {
        body: { action: "list", email: session.email, token: session.token },
      });
      if (error) throw error;
      setSections(data.sections || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const handleToggle = async (section: HomepageSection) => {
    const session = getSession();
    if (!session) return;
    const updated = { ...section, is_visible: !section.is_visible };
    setSections(prev => prev.map(s => s.id === section.id ? updated : s));
    try {
      await supabase.functions.invoke("manage-homepage-sections", {
        body: { action: "update", email: session.email, token: session.token, section: updated },
      });
      toast({ title: `${section.title} ${updated.is_visible ? "shown" : "hidden"}` });
    } catch (err: any) {
      setSections(prev => prev.map(s => s.id === section.id ? section : s));
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (section: HomepageSection) => {
    setEditingSection(section);
    setFormData({ title: section.title, subtitle: section.subtitle, section_key: section.section_key });
  };

  const handleSaveEdit = async () => {
    if (!editingSection) return;
    const session = getSession();
    if (!session) return;
    try {
      await supabase.functions.invoke("manage-homepage-sections", {
        body: {
          action: "update",
          email: session.email,
          token: session.token,
          section: { ...editingSection, title: formData.title, subtitle: formData.subtitle },
        },
      });
      toast({ title: "Section updated" });
      setEditingSection(null);
      fetchSections();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    const session = getSession();
    if (!session) return;
    if (!formData.section_key.trim() || !formData.title.trim()) {
      toast({ title: "Section key and title are required", variant: "destructive" });
      return;
    }
    try {
      await supabase.functions.invoke("manage-homepage-sections", {
        body: {
          action: "create",
          email: session.email,
          token: session.token,
          section: {
            section_key: formData.section_key.trim().toLowerCase().replace(/\s+/g, "_"),
            title: formData.title,
            subtitle: formData.subtitle,
            sort_order: sections.length + 1,
            section_type: "custom",
          },
        },
      });
      toast({ title: "Section created" });
      setIsCreateOpen(false);
      setFormData({ title: "", subtitle: "", section_key: "" });
      fetchSections();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = sections.findIndex(s => s.id === active.id);
    const newIdx = sections.findIndex(s => s.id === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx);
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
    } catch (err: any) {
      toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
      fetchSections();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-heading font-bold">Homepage Sections</h1>
        </div>
        <Button onClick={() => { setFormData({ title: "", subtitle: "", section_key: "" }); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Drag to reorder, toggle visibility, and edit section titles. Changes are reflected on the homepage immediately.
      </p>

      <div className="rounded-md border">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {sections.map(section => (
                  <SortableRow
                    key={section.id}
                    section={section}
                    onEdit={handleEdit}
                    onToggle={handleToggle}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={formData.subtitle} onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))} />
            </div>
            <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Section Key</label>
              <Input placeholder="e.g. summer_sale" value={formData.section_key} onChange={(e) => setFormData(prev => ({ ...prev, section_key: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Unique identifier, lowercase with underscores</p>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="e.g. Summer Sale" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Brief description" value={formData.subtitle} onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))} />
            </div>
            <Button onClick={handleCreate} className="w-full">Create Section</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this custom section.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSections;
