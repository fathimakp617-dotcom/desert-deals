import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  productId?: string;
  image_url?: string;
}

interface InvoiceData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  orderDate: string;
}

const formatCurrency = (amount: number): string => {
  return `${Math.round(amount).toLocaleString()} AED`;
};

/**
 * Fetch image as base64 data URL. Returns null on failure.
 */
const fetchImageAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null as any);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Resolve product image URL from the DB image_url field.
 * Handles comma-separated URLs (takes first), storage paths, and full URLs.
 */
const resolveProductImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  const firstImage = imageUrl.split(",")[0].trim();
  if (!firstImage) return null;
  
  if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
    return firstImage;
  }
  
  // It's a storage path — generate public URL
  const { data } = supabase.storage.from("product-images").getPublicUrl(firstImage);
  return data?.publicUrl || null;
};

/**
 * Fetch product images from the database for the given items.
 */
const fetchProductImages = async (items: OrderItem[]): Promise<Map<string, string>> => {
  const imageMap = new Map<string, string>();
  
  const productIds = items
    .map((item) => item.productId)
    .filter((id): id is string => !!id);
  
  if (productIds.length === 0) return imageMap;
  
  try {
    const { data: products } = await supabase
      .from("products")
      .select("id, image_url")
      .in("id", productIds);
    
    if (!products) return imageMap;
    
    // Fetch all images in parallel
    const fetchPromises = products.map(async (product) => {
      const url = resolveProductImageUrl(product.image_url);
      if (!url) return;
      const dataUrl = await fetchImageAsDataUrl(url);
      if (dataUrl) {
        imageMap.set(product.id, dataUrl);
      }
    });
    
    await Promise.all(fetchPromises);
  } catch {
    // Silently fail — invoice will render without images
  }
  
  return imageMap;
};

export const generateInvoicePDF = async (data: InvoiceData): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 16; // margin

  // Brand colors - company black/white theme
  const black: [number, number, number] = [15, 15, 15];
  const brand: [number, number, number] = [26, 26, 26]; // near-black brand color
  const gray: [number, number, number] = [120, 120, 120];
  const lightBg: [number, number, number] = [248, 248, 248];
  const white: [number, number, number] = [255, 255, 255];

  // Fetch logo and product images
  const logoUrl = `${window.location.origin}/favicon.png`;
  const [logoDataUrl, productImages] = await Promise.all([
    fetchImageAsDataUrl(logoUrl),
    fetchProductImages(data.items),
  ]);

  // === TOP ACCENT BAR ===
  doc.setFillColor(...brand);
  doc.rect(0, 0, pw, 4, "F");

  // === HEADER SECTION ===
  let y = 16;

  // Logo on left
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", m, y - 4, 36, 14);
  } else {
    doc.setTextColor(...black);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("DESERT DEAL", m, y + 6);
  }

  // "INVOICE" on right
  doc.setTextColor(...brand);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pw - m, y + 8, { align: "right" });

  // Thin line under header
  y = 36;
  doc.setDrawColor(...brand);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);

  // === ORDER INFO ROW ===
  y = 44;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);

  // Left column - Bill To
  doc.text("BILL TO", m, y);
  y += 5;
  doc.setTextColor(...black);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName, m, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text(data.customerEmail, m, y + 10);
  doc.text(data.shippingAddress.address, m, y + 16);
  doc.text(
    `${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}`,
    m, y + 22
  );
  doc.text(data.shippingAddress.country, m, y + 28);

  // Right column - Invoice details
  const rx = pw - m;
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.text("INVOICE NO.", rx, 44, { align: "right" });
  doc.setTextColor(...black);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.orderNumber, rx, 49, { align: "right" });

  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("DATE", rx, 58, { align: "right" });
  doc.setTextColor(...black);
  doc.setFontSize(9);
  const formattedDate = new Date(data.orderDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.text(formattedDate, rx, 63, { align: "right" });

  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.text("PAYMENT", rx, 72, { align: "right" });
  doc.setTextColor(...black);
  doc.setFontSize(9);
  const paymentLabel = data.paymentMethod === "cod" ? "Cash on Delivery" : data.paymentMethod;
  doc.text(paymentLabel, rx, 77, { align: "right" });

  // === ITEMS TABLE ===
  y = 90;
  const imgSize = 10;

  const tableData = data.items.map((item) => {
    const sizeText = (item as any).selectedSize ? ` (${(item as any).selectedSize})` : "";
    return [
      "", // image placeholder
      `${item.name}${sizeText}`,
      item.quantity.toString(),
      formatCurrency(item.price),
      formatCurrency(item.price * item.quantity),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["", "ITEM DESCRIPTION", "QTY", "PRICE", "AMOUNT"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: white,
      textColor: brand,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    bodyStyles: {
      textColor: black,
      fontSize: 9,
      minCellHeight: imgSize + 6,
      valign: "middle",
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    alternateRowStyles: {
      fillColor: lightBg,
    },
    columnStyles: {
      0: { cellWidth: imgSize + 6, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 32, halign: "right" },
    },
    margin: { left: m, right: m },
    tableLineColor: [230, 230, 230],
    tableLineWidth: 0.2,
    didDrawCell: (cellData) => {
      if (cellData.section === "head") {
        doc.setDrawColor(...brand);
        doc.setLineWidth(0.8);
        doc.line(
          cellData.cell.x,
          cellData.cell.y + cellData.cell.height,
          cellData.cell.x + cellData.cell.width,
          cellData.cell.y + cellData.cell.height
        );
      }
      if (cellData.section === "body" && cellData.column.index === 0) {
        const item = data.items[cellData.row.index];
        const imgDataUrl = item.productId ? productImages.get(item.productId) : null;
        if (imgDataUrl) {
          try {
            const x = cellData.cell.x + (cellData.cell.width - imgSize) / 2;
            const cy = cellData.cell.y + (cellData.cell.height - imgSize) / 2;
            doc.addImage(imgDataUrl, "JPEG", x, cy, imgSize, imgSize);
          } catch { /* skip */ }
        }
      }
    },
  });

  // === TOTALS ===
  let ty = (doc as any).lastAutoTable.finalY + 8;
  const totalsLeft = pw - m - 75;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text("Subtotal", totalsLeft, ty);
  doc.setTextColor(...black);
  doc.text(formatCurrency(data.subtotal), pw - m, ty, { align: "right" });

  if (data.discount > 0) {
    ty += 7;
    doc.setTextColor(34, 197, 94);
    doc.text("Discount", totalsLeft, ty);
    doc.text(`-${formatCurrency(data.discount)}`, pw - m, ty, { align: "right" });
  }

  ty += 7;
  doc.setTextColor(...gray);
  doc.text("Shipping", totalsLeft, ty);
  doc.setTextColor(...black);
  doc.text(data.shipping === 0 ? "FREE" : formatCurrency(data.shipping), pw - m, ty, { align: "right" });

  // Divider
  ty += 6;
  doc.setDrawColor(...brand);
  doc.setLineWidth(0.8);
  doc.line(totalsLeft - 4, ty, pw - m, ty);

  // Total
  ty += 8;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brand);
  doc.text("TOTAL", totalsLeft, ty);
  doc.text(formatCurrency(data.total), pw - m, ty, { align: "right" });

  // === FOOTER ===
  doc.setFillColor(...brand);
  doc.rect(0, ph - 28, pw, 28, "F");

  doc.setTextColor(...white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESERT DEAL", pw / 2, ph - 20, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "support@desertsdeals.com  |  +971 50 678 4405  |  United Arab Emirates",
    pw / 2, ph - 13, { align: "center" }
  );
  doc.text(
    `Thank you for your purchase!  ©${new Date().getFullYear()} Desert Deal`,
    pw / 2, ph - 7, { align: "center" }
  );

  return doc;
};

export const downloadInvoicePDF = async (data: InvoiceData): Promise<void> => {
  const doc = await generateInvoicePDF(data);
  doc.save(`invoice-${data.orderNumber}.pdf`);
};

// Shipping Slip PDF - A4 size, matches the ShippingSlip component design
interface ShippingLabelOrder {
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  payment_method?: string;
  payment_status?: string;
  total?: number;
  created_at?: string;
  shipping_address: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    pincode?: string;
    country?: string;
  };
  items?: any[];
}

export const generateShippingLabelPDF = async (order: ShippingLabelOrder): Promise<void> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const darkColor: [number, number, number] = [0, 0, 0];
  const isPrepaid = order.payment_status === "paid" || order.payment_method !== "cod";
  const totalAmount = Math.round(order.total || 0);
  const itemCount = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
  const paymentLabel = isPrepaid ? `PREPAID : ${formatCurrency(totalAmount)}` : `CASH ON DELIVERY : ${formatCurrency(totalAmount)}`;

  let yPos = 50;

  // Outer border
  doc.setDrawColor(0);
  doc.setLineWidth(2);
  doc.rect(margin - 10, 30, contentWidth + 20, 700);

  // Header - DESERT DEAL
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkColor);
  doc.text("DESERT DEAL", margin, yPos);

  yPos += 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("PREMIUM FOOTWEAR", margin, yPos);

  // Header divider
  yPos += 12;
  doc.setLineWidth(2);
  doc.line(margin - 10, yPos, pageWidth - margin + 10, yPos);

  // Order Info Table
  yPos += 25;
  doc.setLineWidth(2);
  doc.rect(margin, yPos - 15, contentWidth, 80);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`ORDER: ${order.order_number}`, margin + 10, yPos);

  yPos += 16;
  const orderDate = order.created_at ? new Date(order.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
  doc.text(`DATE: ${orderDate}`, margin + 10, yPos);

  yPos += 20;
  doc.setFontSize(16);
  
  // Payment box
  const paymentBoxWidth = doc.getTextWidth(paymentLabel) + 20;
  doc.setLineWidth(3);
  doc.rect(margin + 10, yPos - 15, paymentBoxWidth, 25);
  doc.text(paymentLabel, margin + 20, yPos);

  // Items count on the right
  doc.setFontSize(12);
  doc.text(`Items: ${itemCount}`, pageWidth - margin - 10, yPos - 35, { align: "right" });

  // Address Table
  yPos += 45;
  const addressBoxHeight = 130;
  const halfWidth = (contentWidth - 10) / 2;

  // Ship To Box
  doc.setLineWidth(2);
  doc.rect(margin, yPos, halfWidth, addressBoxHeight);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SHIP TO", margin + 10, yPos + 20);
  doc.setLineWidth(2);
  doc.line(margin + 10, yPos + 25, margin + halfWidth - 10, yPos + 25);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  let addrY = yPos + 42;
  doc.text(order.customer_name, margin + 10, addrY);
  
  addrY += 16;
  doc.setFont("helvetica", "normal");
  const address = order.shipping_address;
  if (address?.address) {
    const lines = doc.splitTextToSize(address.address, halfWidth - 25);
    doc.text(lines, margin + 10, addrY);
    addrY += lines.length * 14;
  }
  
  const cityState = `${address?.city || ""}, ${address?.state || ""} - ${address?.zipCode || address?.pincode || ""}`;
  doc.text(cityState, margin + 10, addrY);
  addrY += 14;
  
  doc.text(address?.country || "UAE", margin + 10, addrY);
  addrY += 14;
  
  doc.text(`PHONE: ${order.customer_phone || "N/A"}`, margin + 10, addrY);

  // Seller Box
  const sellerX = margin + halfWidth + 10;
  doc.rect(sellerX, yPos, halfWidth, addressBoxHeight);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SELLER", sellerX + 10, yPos + 20);
  doc.line(sellerX + 10, yPos + 25, sellerX + halfWidth - 10, yPos + 25);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  let sellerY = yPos + 42;
  doc.text("DESERT DEAL", sellerX + 10, sellerY);
  
  sellerY += 16;
  doc.setFont("helvetica", "normal");
  doc.text("United Arab Emirates", sellerX + 10, sellerY);
  sellerY += 14;
  doc.text("PHONE: +971 50 678 4405", sellerX + 10, sellerY);

  // Product Details Table
  yPos += addressBoxHeight + 20;
  
  // Table header
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.rect(margin, yPos, contentWidth * 0.8, 25);
  doc.rect(margin + contentWidth * 0.8, yPos, contentWidth * 0.2, 25);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PRODUCT", margin + 10, yPos + 17);
  doc.text("QTY", margin + contentWidth * 0.8 + 10, yPos + 17);

  // Table rows
  yPos += 25;
  const items = order.items || [];
  items.forEach((item: any) => {
    doc.rect(margin, yPos, contentWidth * 0.8, 25);
    doc.rect(margin + contentWidth * 0.8, yPos, contentWidth * 0.2, 25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(item.name || item.product_name || "Product", margin + 10, yPos + 17);
    doc.text(String(item.quantity || 1), margin + contentWidth - 30, yPos + 17, { align: "right" });
    yPos += 25;
  });

  // Total Amount Box
  yPos += 15;
  doc.setLineWidth(2);
  doc.rect(margin, yPos, contentWidth, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL : ${formatCurrency(totalAmount)}`, pageWidth - margin - 10, yPos + 20, { align: "right" });

  // Return Address Box
  yPos += 45;
  doc.rect(margin, yPos, contentWidth, 65);
  
  doc.setFontSize(12);
  doc.text("RETURN ADDRESS", margin + 10, yPos + 18);
  doc.setLineWidth(2);
  doc.line(margin + 10, yPos + 23, margin + 120, yPos + 23);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const returnAddr = "DESERT DEAL, United Arab Emirates, PHONE: +971 50 678 4405";
  const returnLines = doc.splitTextToSize(returnAddr, contentWidth - 20);
  doc.text(returnLines, pageWidth / 2, yPos + 42, { align: "center" });

  // Footer
  yPos += 80;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("THANK YOU FOR SHOPPING", pageWidth / 2, yPos, { align: "center" });

  // Save
  doc.save(`shipping-slip-${order.order_number}.pdf`);
};
