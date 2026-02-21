import { useState, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  CreditCard,
  Calendar,
  Truck,
  Tag,
  ExternalLink,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface OrderItem {
  productId?: string;
  name?: string;
  product_name?: string;
  price: number;
  quantity: number;
  selectedSize?: string | null;
}

interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  pincode?: string;
  country: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  subtotal: number;
  discount?: number | null;
  shipping?: number | null;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  coupon_code?: string | null;
  affiliate_code?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
}

interface OrderViewDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderViewDialog = ({ order, open, onOpenChange }: OrderViewDialogProps) => {
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!order || !open) return;
    const productIds = order.items
      .map((item) => item.productId)
      .filter(Boolean) as string[];
    if (productIds.length === 0) return;

    supabase
      .from("products")
      .select("id, image_url")
      .in("id", productIds)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        data.forEach((p) => {
          if (p.image_url) {
            map[p.id] = p.image_url.split(",")[0].trim();
          }
        });
        setProductImages(map);
      });
  }, [order, open]);

  const handleDownloadImage = useCallback(async () => {
    if (!contentRef.current || !order) return;
    const canvas = await html2canvas(contentRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `order-${order.order_number}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [order]);

  const [isSharing, setIsSharing] = useState(false);

  const handleShareWhatsApp = useCallback(async () => {
    if (!contentRef.current || !order || !order.customer_phone) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );

      // Upload to storage for a shareable link
      const fileName = `order-${order.order_number}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("order-images")
        .upload(fileName, blob, { contentType: "image/png", upsert: true });

      const phone = order.customer_phone.replace(/[^0-9]/g, '');
      
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from("order-images").getPublicUrl(fileName);
        const imageUrl = urlData?.publicUrl || '';
        const message = `🛍️ *Desert Deal - Order Confirmation*\n\n📦 Order: *${order.order_number}*\n💰 Total: *${formatCurrency(order.total)}*\n📋 Status: *${order.order_status}*\n\n🖼️ Order Details: ${imageUrl}\n\nThank you for shopping with Desert Deal! 🌟`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      } else {
        // Fallback: just send text
        const message = `🛍️ *Desert Deal - Order Confirmation*\n\n📦 Order: *${order.order_number}*\n💰 Total: *${formatCurrency(order.total)}*\n📋 Status: *${order.order_status}*\n\nThank you for shopping with Desert Deal! 🌟`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setIsSharing(false);
    }
  }, [order]);

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "processing": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "shipped": return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "delivered": return "bg-green-500/10 text-green-600 border-green-200";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-600 border-green-200";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "failed": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const zipCode = order.shipping_address?.zipCode || order.shipping_address?.pincode || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Order Details - {order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div ref={contentRef} className="bg-white rounded-xl overflow-hidden" style={{ color: '#1a1a1a' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Desert Deal</h2>
                <p className="text-neutral-400 text-xs mt-0.5">desertsdeals.com</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{order.order_number}</p>
                <p className="text-neutral-400 text-xs mt-0.5">{formatDate(order.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Status Row */}
          <div className="px-6 py-3 flex items-center gap-3 border-b" style={{ borderColor: '#f0f0f0' }}>
            <Badge variant="outline" className={`capitalize text-xs ${getStatusColor(order.order_status)}`}>
              {order.order_status}
            </Badge>
            <Badge variant="outline" className={`capitalize text-xs ${getPaymentStatusColor(order.payment_status)}`}>
              {order.payment_status}
            </Badge>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f5f5f5', color: '#666' }}>
              {order.payment_method === "cod" ? "Cash on Delivery" : "Online"}
            </span>
          </div>

          {/* Two Column: Customer + Shipping */}
          <div className="px-6 py-4 grid grid-cols-2 gap-6 border-b" style={{ borderColor: '#f0f0f0' }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#999' }}>Customer</p>
              <p className="text-sm font-medium">{order.customer_name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#666' }}>{order.customer_email}</p>
              {order.customer_phone && (
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-xs" style={{ color: '#666' }}>{order.customer_phone}</p>
                    <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    disabled={isSharing}
                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full transition-colors disabled:opacity-50"
                    style={{ background: '#dcfce7', color: '#16a34a' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" className="h-3 w-3"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {isSharing ? "Sending..." : "Share"}
                  </button>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#999' }}>Ship To</p>
              <p className="text-sm font-medium">{order.shipping_address?.address}</p>
              <p className="text-xs mt-0.5" style={{ color: '#666' }}>
                {order.shipping_address?.city}, {order.shipping_address?.state} {zipCode}
              </p>
              <p className="text-xs" style={{ color: '#666' }}>{order.shipping_address?.country}</p>
            </div>
          </div>

          {order.tracking_number && (
            <div className="px-6 py-2.5 border-b flex items-center gap-2" style={{ borderColor: '#f0f0f0', background: '#fafafa' }}>
              <Truck className="h-3.5 w-3.5" style={{ color: '#999' }} />
              <span className="text-xs" style={{ color: '#666' }}>Tracking:</span>
              <span className="text-xs font-medium">{order.tracking_number}</span>
              {order.tracking_url && (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#2563eb' }}>
                  Track →
                </a>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#999' }}>Items</p>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {item.productId && productImages[item.productId] ? (
                    <img
                      src={productImages[item.productId]}
                      alt={item.name || item.product_name || "Product"}
                      className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                      style={{ border: '1px solid #e5e5e5' }}
                      onError={(e) => { e.currentTarget.src = "/images/product-placeholder.jpg"; }}
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f5f5f5' }}>
                      <Package className="h-5 w-5" style={{ color: '#ccc' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{item.name || item.product_name || "Product"}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#999' }}>
                      Qty: {item.quantity}
                      {item.selectedSize && <span> · Size: {item.selectedSize}</span>}
                    </p>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon */}
          {order.coupon_code && (
            <div className="px-6 pb-2">
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <Tag className="h-3 w-3" />
                {order.coupon_code}
              </span>
            </div>
          )}

          {/* Summary */}
          <div className="px-6 py-4 mt-1" style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#666' }}>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount != null && order.discount > 0 && (
                <div className="flex justify-between text-sm" style={{ color: '#16a34a' }}>
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.shipping !== undefined && order.shipping !== null && order.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#666' }}>Shipping</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-2" style={{ borderTop: '1px solid #e5e5e5' }}>
                <span className="text-base font-bold">Total</span>
                <span className="text-base font-bold">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 text-center" style={{ borderTop: '1px solid #f0f0f0' }}>
            <p className="text-[10px]" style={{ color: '#bbb' }}>Thank you for shopping with Desert Deal · desertsdeals.com</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={handleDownloadImage}>
            <Download className="h-4 w-4 mr-2" />
            Download as Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderViewDialog;
