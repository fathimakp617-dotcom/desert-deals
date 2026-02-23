import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2, ImageIcon } from "lucide-react";
import type { Banner } from "@/hooks/useBanners";

interface SortableBannerItemProps {
  banner: Banner;
  onEdit: (b: Banner) => void;
  onDelete: (id: string) => void;
}

const SortableBannerItem = ({ banner, onEdit, onDelete }: SortableBannerItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 bg-card border border-border rounded-lg p-3 ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none p-1 rounded hover:bg-muted"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
      <div className="w-24 h-14 rounded-md overflow-hidden bg-muted shrink-0">
        {banner.image_url ? (
          <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{banner.title || "Untitled"}</p>
        <p className="text-xs text-muted-foreground truncate">{banner.link_url}</p>
      </div>
      <div className={`px-2 py-0.5 rounded-full text-xs ${banner.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
        {banner.is_active ? "Active" : "Inactive"}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onEdit(banner)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(banner.id)} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SortableBannerItem;
