import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tag } from "lucide-react";

interface MiindPricePopupProps {
  open: boolean;
  onClose: () => void;
}

export const isMiindProduct = (productName: string) =>
  /miind/i.test(productName);

const MiindPricePopup = ({ open, onClose }: MiindPricePopupProps) => (
  <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
    <AlertDialogContent className="max-w-md">
      <AlertDialogHeader>
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          <AlertDialogTitle className="text-base">Price Notice</AlertDialogTitle>
        </div>
        <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground pt-2">
          All <span className="font-semibold text-foreground">Miind</span> products are priced at{" "}
          <span className="font-semibold text-foreground">289 AED</span>. Thank you for shopping with us!
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction onClick={onClose}>Got it!</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default MiindPricePopup;
