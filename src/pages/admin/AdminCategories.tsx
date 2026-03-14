import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";

interface Category {
  id: string;
  value: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  show_in_collection: boolean;
  show_in_header: boolean;
  created_at: string;
}

const getAdminSession = () => {
  try {
    const stored = sessionStorage.getItem("rayn_admin_session");
    if (!stored) return null;
    const s = JSON.parse(stored);
    if (new Date(s.expiry) < new Date()) return null;
    return { email: s.email, token: s.token };
  } catch { return null; }
};

const AdminCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newActive, setNewActive] = useState(true);
  const [newShowInCollection, setNewShowInCollection] = useState(true);
  const [newShowInHeader, setNewShowInHeader] = useState(true);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("manage-categories", {
        body: { action: "list", admin_email: session.email, admin_token: session.token },
      });
      if (error) throw error;
      return (data.categories || []) as Category[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("manage-categories", {
        body: {
          action: "create",
          category: {
            value: newValue || newLabel,
            label: newLabel,
            is_active: newActive,
            show_in_collection: newShowInCollection,
            show_in_header: newShowInHeader,
          },
          admin_email: session.email,
          admin_token: session.token,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsAddOpen(false);
      setNewLabel("");
      setNewValue("");
      setNewActive(true);
      setNewShowInCollection(true);
      setNewShowInHeader(true);
      toast({ title: "Category created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (cat: Partial<Category> & { id: string }) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("manage-categories", {
        body: {
          action: "update",
          category: cat,
          admin_email: session.email,
          admin_token: session.token,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(null);
      toast({ title: "Category updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("manage-categories", {
        body: {
          action: "delete",
          category: { id },
          admin_email: session.email,
          admin_token: session.token,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const generateSlug = (label: string) =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm">{categories.length} categories</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newLabel.trim()) return;
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <Label>Category Name</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => {
                    setNewLabel(e.target.value);
                    setNewValue(generateSlug(e.target.value));
                  }}
                  placeholder="e.g. Gucci"
                  required
                />
              </div>
              <div>
                <Label>Slug (auto-generated)</Label>
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="gucci"
                />
               </div>
              <div className="flex items-center gap-2">
                <Switch checked={newActive} onCheckedChange={setNewActive} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newShowInCollection} onCheckedChange={setNewShowInCollection} />
                <Label>Show in Collection (homepage rows)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newShowInHeader} onCheckedChange={setNewShowInHeader} />
                <Label>Show in Header Navigation</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Category
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => { if (!open) setEditingCategory(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingCategory.id,
                  label: editingCategory.label,
                  is_active: editingCategory.is_active,
                  sort_order: editingCategory.sort_order,
                  show_in_collection: editingCategory.show_in_collection,
                  show_in_header: editingCategory.show_in_header,
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label>Category Name</Label>
                <Input
                  value={editingCategory.label}
                  onChange={(e) => setEditingCategory({ ...editingCategory, label: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Slug (read-only)</Label>
                <Input value={editingCategory.value} disabled />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={editingCategory.sort_order}
                  onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingCategory.is_active}
                  onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingCategory.show_in_collection}
                  onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, show_in_collection: checked })}
                />
                <Label>Show in Collection (homepage rows)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingCategory.show_in_header}
                  onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, show_in_header: checked })}
                />
                <Label>Show in Header Navigation</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="text-muted-foreground text-sm">{cat.sort_order}</TableCell>
                <TableCell className="font-medium">{cat.label}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{cat.value}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cat.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingCategory(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${cat.label}"?`)) deleteMutation.mutate(cat.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No categories yet. Add your first category.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCategories;
