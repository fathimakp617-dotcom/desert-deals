import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Truck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface ShippingTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  paymentMethod: string;
  shippingCharge: number;
}

const ShippingTermsDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: ShippingTermsDialogProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleConfirm = () => {
    if (termsAccepted) {
      onConfirm();
      setTermsAccepted(false);
    }
  };

  const handleClose = () => {
    setTermsAccepted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Truck className="h-5 w-5 text-primary" />
            Confirm Your Order
          </DialogTitle>
          <DialogDescription>
            Please review and accept the terms before placing your order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Truck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Cash on Delivery • Shipping: 20 AED
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll pay the full amount (including 20 AED shipping) when your order is delivered.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I have read and agree to the{" "}
                <Link to="/terms" target="_blank" className="text-primary hover:underline">
                  Terms & Conditions
                </Link>
                , including the shipping and return policies.
              </Label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleConfirm}
            disabled={!termsAccepted}
          >
            Confirm & Place Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingTermsDialog;
