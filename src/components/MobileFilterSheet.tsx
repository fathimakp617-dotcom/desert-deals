import { X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  sortOptions: { label: string; value: string }[];
  sortBy: string;
  onSortChange: (val: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const MobileFilterSheet = ({
  open,
  onOpenChange,
  categories,
  selectedCategory,
  onCategoryChange,
  sortOptions,
  sortBy,
  onSortChange,
  onClear,
  hasActiveFilters,
}: MobileFilterSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-background">
        <DrawerHeader className="flex items-center justify-between border-b border-border pb-3">
          <DrawerTitle className="text-base font-semibold">Filters & Sort</DrawerTitle>
          <DrawerClose asChild>
            <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 py-4 space-y-6 overflow-y-auto">
          {/* Category */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Sort By</h3>
            <div className="space-y-1.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSortChange(opt.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    sortBy === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border flex gap-3">
          {hasActiveFilters && (
            <Button variant="outline" className="flex-1" onClick={onClear}>
              Clear All
            </Button>
          )}
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Show Results
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileFilterSheet;
