import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface Mind001SizeWarningProps {
  open: boolean;
  onClose: () => void;
}

export const isMind001 = (productName: string) =>
  /mind\s*001/i.test(productName);

const Mind001SizeWarning = ({ open, onClose }: Mind001SizeWarningProps) => (
  <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
    <AlertDialogContent className="max-w-md">
      <AlertDialogHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <AlertDialogTitle className="text-base">Size Recommendation</AlertDialogTitle>
        </div>
        <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground pt-2">
          If you are purchasing <span className="font-semibold text-foreground">Mind 001</span>, we recommend choosing{" "}
          <span className="font-semibold text-foreground">one size larger</span> than your usual size. We have received
          feedback from customers that it runs small and feels too tight. After checking your order, we noticed you
          selected this item. Thank you for your understanding.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction onClick={onClose}>Got it, thanks!</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default Mind001SizeWarning;
