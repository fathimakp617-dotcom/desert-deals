import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface ShippingAddress {
  address?: string;
  street?: string;
  city: string;
  state: string;
  zipCode?: string;
  pincode?: string;
  country?: string;
}

// Helper function to safely get address string from shipping address
const getAddressString = (addr: ShippingAddress): string => {
  return addr.address || addr.street || '';
};

// Helper function to safely get zipcode string
const getZipCode = (addr: ShippingAddress): string => {
  return addr.zipCode || addr.pincode || '';
};

interface OrderConfirmationRequest {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shipping_address: ShippingAddress;
  payment_method: string;
  coupon_code?: string;
  affiliate_code?: string;
}

const formatCurrency = (amount: number): string => {
  return `${Math.round(amount).toLocaleString()} AED`;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/product-images/brand/desert-deal-logo-dark.png`;

const getProductImageUrl = (item: OrderItem): string => {
  if (item.image_url) {
    // Use first image from comma-separated list
    const firstImg = item.image_url.split(",")[0].trim();
    if (firstImg.startsWith("http")) return firstImg;
    return `${SUPABASE_URL}/storage/v1/object/public/product-images/${firstImg}`;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${item.productId}.webp`;
};

/** Fetches product image URLs from DB and enriches order items */
const enrichItemsWithImages = async (items: OrderItem[]): Promise<OrderItem[]> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const sb = createClient(supabaseUrl, serviceKey);
    const ids = items.map(i => i.productId);
    const { data } = await sb.from("products").select("id, image_url").in("id", ids);
    if (data) {
      const imgMap = new Map(data.map((p: any) => [p.id, p.image_url]));
      return items.map(item => ({
        ...item,
        image_url: (imgMap.get(item.productId) as string) || item.image_url || "",
      }));
    }
  } catch (e) {
    console.error("Failed to enrich items with images:", e);
  }
  return items;
};

const generateOrderEmailHTML = (order: OrderConfirmationRequest): string => {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 14px; border-bottom: 1px solid #eee; width: 60px;">
        <img src="${getProductImageUrl(item)}" alt="${item.name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;" />
      </td>
      <td style="padding: 14px; border-bottom: 1px solid #eee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
        ${item.name}
      </td>
      <td style="padding: 14px; border-bottom: 1px solid #eee; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #555;">
        ${item.quantity}
      </td>
      <td style="padding: 14px; border-bottom: 1px solid #eee; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; font-weight: 500;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  const paymentMethodLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background-color: #1a1a1a; padding: 30px 40px; text-align: center;">
                  <img src="${LOGO_URL}" alt="Desert Deal" style="height: 50px; margin-bottom: 8px;" />
                  <p style="margin: 0; color: #999; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">
                    Premium Collection
                  </p>
                </td>
              </tr>
              
              <!-- Order Confirmation -->
              <tr>
                <td style="padding: 40px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 64px; height: 64px; background-color: #1a1a1a; border-radius: 50%; display: inline-block; line-height: 64px;">
                      <span style="color: #ffffff; font-size: 32px;">✓</span>
                    </div>
                  </div>
                  
                  <h2 style="margin: 0 0 10px; text-align: center; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                    Thank You for Your Order!
                  </h2>
                  <p style="margin: 0 0 30px; text-align: center; color: #555; font-size: 15px; line-height: 1.6;">
                    Hi ${order.customer_name}, your order has been confirmed.
                  </p>
                  
                  <div style="text-align: center; margin-bottom: 25px;">
                    <p style="margin: 0; color: #888; font-size: 13px;">
                      📄 Your invoice is attached to this email
                    </p>
                  </div>
                  
                  <!-- Order Number -->
                  <div style="background-color: #f5f5f5; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">
                      Order Number
                    </p>
                    <p style="margin: 0; color: #1a1a1a; font-size: 22px; font-weight: 700; letter-spacing: 2px;">
                      ${order.order_number}
                    </p>
                  </div>
                  
                  <!-- Order Items -->
                  <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; font-weight: 600; letter-spacing: 1px;">
                    Order Summary
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #1a1a1a;">
                        <th style="padding: 14px; width: 60px;"></th>
                        <th style="padding: 14px; text-align: left; font-size: 11px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Item</th>
                        <th style="padding: 14px; text-align: center; font-size: 11px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                        <th style="padding: 14px; text-align: right; font-size: 11px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHTML}
                    </tbody>
                  </table>
                  
                  <!-- Order Totals -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 10px 0; color: #888; font-size: 14px;">Subtotal</td>
                      <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-size: 14px;">${formatCurrency(order.subtotal)}</td>
                    </tr>
                    ${order.discount > 0 ? `
                    <tr>
                      <td style="padding: 10px 0; color: #22c55e; font-size: 14px;">
                        Discount ${order.coupon_code ? `<span style="color: #888; font-size: 12px;">(${order.coupon_code})</span>` : order.affiliate_code ? `<span style="color: #888; font-size: 12px;">(${order.affiliate_code})</span>` : ''}
                      </td>
                      <td style="padding: 10px 0; text-align: right; color: #22c55e; font-size: 14px;">-${formatCurrency(order.discount)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 10px 0; color: #888; font-size: 14px;">Shipping</td>
                      <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-size: 14px;">${order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 0; border-top: 2px solid #1a1a1a; font-weight: 700; color: #1a1a1a; font-size: 18px;">Total</td>
                      <td style="padding: 15px 0; border-top: 2px solid #1a1a1a; text-align: right; font-weight: 700; color: #1a1a1a; font-size: 20px;">${formatCurrency(order.total)}</td>
                    </tr>
                  </table>
                  
                  <!-- Shipping Address -->
                  <div style="background-color: #f5f5f5; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 12px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">📍 Shipping Address</h4>
                    <p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.7;">
                      ${order.customer_name}<br>
                      ${getAddressString(order.shipping_address)}<br>
                      ${order.shipping_address.city}, ${order.shipping_address.state} ${getZipCode(order.shipping_address)}<br>
                      ${order.shipping_address.country || 'UAE'}
                    </p>
                  </div>
                  
                  <!-- Payment Method -->
                  <div style="background-color: #f5f5f5; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                    <h4 style="margin: 0 0 12px; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">💳 Payment Method</h4>
                    <p style="margin: 0; color: #1a1a1a; font-size: 14px;">${paymentMethodLabel}</p>
                  </div>
                  
                  <p style="margin: 0; text-align: center; color: #888; font-size: 14px; line-height: 1.6;">
                    If you have any questions about your order, please contact us at<br>
                    <a href="mailto:support@desertsdeals.com" style="color: #1a1a1a; text-decoration: underline; font-weight: 500;">support@desertsdeals.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                  <p style="margin: 0 0 8px; color: #ffffff; font-size: 13px; letter-spacing: 2px; font-weight: 600;">DESERT DEAL</p>
                  <p style="margin: 0; color: #999; font-size: 11px;">
                    © ${new Date().getFullYear()} Desert Deal. All rights reserved.
                  </p>
                  <p style="margin: 8px 0 0; color: #777; font-size: 10px;">
                    United Arab Emirates | Phone: +971 50 678 4405
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const fetchImageBytes = async (url: string): Promise<{ bytes: Uint8Array; type: string } | null> => {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const ct = resp.headers.get("content-type") || "";
    const bytes = new Uint8Array(await resp.arrayBuffer());
    const type = ct.includes("png") ? "png" : "jpg";
    return { bytes, type };
  } catch {
    return null;
  }
};

const generateInvoicePDF = async (order: OrderConfirmationRequest): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const m = 45; // margin

  // Brand colors
  const brand = rgb(0.1, 0.1, 0.1);
  const black = rgb(0.06, 0.06, 0.06);
  const gray = rgb(0.47, 0.47, 0.47);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const bgLight = rgb(0.97, 0.97, 0.97);
  const white = rgb(1, 1, 1);
  const green = rgb(0.13, 0.77, 0.37);

  const formattedDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const paymentMethodLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method;

  // Fetch logo and product images in parallel
  const logoPromise = fetchImageBytes(LOGO_URL);
  const productImagePromises = order.items.map(item => fetchImageBytes(getProductImageUrl(item)));
  const [logoResult, ...productImageResults] = await Promise.all([logoPromise, ...productImagePromises]);

  // === TOP ACCENT BAR ===
  page.drawRectangle({ x: 0, y: height - 11, width, height: 11, color: brand });

  let y = height - 45;

  // === HEADER: Logo left, INVOICE right ===
  if (logoResult) {
    try {
      const logoImage = logoResult.type === "png"
        ? await pdfDoc.embedPng(logoResult.bytes)
        : await pdfDoc.embedJpg(logoResult.bytes);
      const logoDims = logoImage.scale(1);
      const logoH = 32;
      const logoW = (logoDims.width / logoDims.height) * logoH;
      page.drawImage(logoImage, { x: m, y: y - 8, width: logoW, height: logoH });
    } catch {
      page.drawText('DESERT DEAL', { x: m, y: y + 6, size: 18, font: boldFont, color: black });
    }
  } else {
    page.drawText('DESERT DEAL', { x: m, y: y + 6, size: 18, font: boldFont, color: black });
  }

  page.drawText('INVOICE', { x: width - m - 100, y: y + 4, size: 28, font: boldFont, color: brand });

  // Header line
  y -= 18;
  page.drawLine({ start: { x: m, y }, end: { x: width - m, y }, thickness: 1.2, color: brand });

  // === BILL TO (left) & INVOICE DETAILS (right) ===
  y -= 22;
  page.drawText('BILL TO', { x: m, y, size: 8, font, color: gray });

  // Right column labels
  page.drawText('INVOICE NO.', { x: width - m - 80, y, size: 8, font, color: gray });

  y -= 12;
  page.drawText(order.customer_name, { x: m, y, size: 11, font: boldFont, color: black });
  page.drawText(order.order_number, { x: width - m - 80, y, size: 11, font: boldFont, color: black });

  y -= 14;
  page.drawText(order.customer_email, { x: m, y, size: 8, font, color: gray });
  page.drawText('DATE', { x: width - m - 80, y: y + 2, size: 8, font, color: gray });

  y -= 12;
  page.drawText(getAddressString(order.shipping_address), { x: m, y, size: 8, font, color: gray });
  page.drawText(formattedDate, { x: width - m - 80, y: y + 2, size: 9, font, color: black });

  y -= 12;
  page.drawText(`${order.shipping_address.city}, ${order.shipping_address.state} ${getZipCode(order.shipping_address)}`, { x: m, y, size: 8, font, color: gray });
  page.drawText('PAYMENT', { x: width - m - 80, y: y + 2, size: 8, font, color: gray });

  y -= 12;
  page.drawText(order.shipping_address.country || 'UAE', { x: m, y, size: 8, font, color: gray });
  page.drawText(paymentMethodLabel, { x: width - m - 80, y: y + 2, size: 9, font, color: black });

  // === ITEMS TABLE ===
  y -= 30;
  const colImg = m;
  const colName = m + 45;
  const colQty = 380;
  const colPrice = 430;
  const colAmount = width - m - 5;
  const imgSize = 28;

  // Table header
  page.drawText('ITEM DESCRIPTION', { x: colName, y, size: 8, font: boldFont, color: brand });
  page.drawText('QTY', { x: colQty, y, size: 8, font: boldFont, color: brand });
  page.drawText('PRICE', { x: colPrice, y, size: 8, font: boldFont, color: brand });
  page.drawText('AMOUNT', { x: colAmount - 30, y, size: 8, font: boldFont, color: brand });

  y -= 6;
  page.drawLine({ start: { x: m, y }, end: { x: width - m, y }, thickness: 1.5, color: brand });

  // Table rows
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    const rowH = imgSize + 10;
    y -= rowH;

    // Alternate row background
    if (i % 2 === 1) {
      page.drawRectangle({ x: m - 5, y: y - 4, width: width - 2 * m + 10, height: rowH, color: bgLight });
    }

    // Product image
    const imgResult = productImageResults[i];
    if (imgResult) {
      try {
        const img = imgResult.type === "png"
          ? await pdfDoc.embedPng(imgResult.bytes)
          : await pdfDoc.embedJpg(imgResult.bytes);
        page.drawImage(img, { x: colImg, y: y - 2, width: imgSize, height: imgSize });
      } catch {
        page.drawRectangle({ x: colImg, y: y - 2, width: imgSize, height: imgSize, color: lightGray });
      }
    } else {
      page.drawRectangle({ x: colImg, y: y - 2, width: imgSize, height: imgSize, color: lightGray });
    }

    const sizeText = (item as any).selectedSize ? ` (${(item as any).selectedSize})` : "";
    page.drawText(`${item.name.substring(0, 35)}${sizeText}`, { x: colName, y: y + imgSize / 2 - 4, size: 9, font, color: black });
    page.drawText(item.quantity.toString(), { x: colQty + 5, y: y + imgSize / 2 - 4, size: 9, font, color: black });
    page.drawText(formatCurrency(item.price), { x: colPrice - 5, y: y + imgSize / 2 - 4, size: 9, font, color: black });
    page.drawText(formatCurrency(item.price * item.quantity), { x: colAmount - 35, y: y + imgSize / 2 - 4, size: 9, font, color: black });
  }

  // === TOTALS ===
  y -= 20;
  const tl = 370; // totals left x

  page.drawText('Subtotal', { x: tl, y, size: 9, font, color: gray });
  page.drawText(formatCurrency(order.subtotal), { x: colAmount - 35, y, size: 9, font, color: black });

  if (order.discount > 0) {
    y -= 16;
    page.drawText('Discount', { x: tl, y, size: 9, font, color: green });
    page.drawText(`-${formatCurrency(order.discount)}`, { x: colAmount - 35, y, size: 9, font, color: green });
  }

  y -= 16;
  page.drawText('Shipping', { x: tl, y, size: 9, font, color: gray });
  page.drawText(order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping), { x: colAmount - 35, y, size: 9, font, color: black });

  // Divider
  y -= 10;
  page.drawLine({ start: { x: tl - 5, y }, end: { x: width - m, y }, thickness: 1.5, color: brand });

  // Total
  y -= 18;
  page.drawText('TOTAL', { x: tl, y, size: 14, font: boldFont, color: brand });
  page.drawText(formatCurrency(order.total), { x: colAmount - 45, y, size: 14, font: boldFont, color: brand });

  // === FOOTER BAR ===
  page.drawRectangle({ x: 0, y: 0, width, height: 70, color: brand });

  page.drawText('DESERT DEAL', { x: width / 2 - 35, y: 48, size: 10, font: boldFont, color: white });
  page.drawText('support@desertsdeals.com  |  +971 50 678 4405  |  United Arab Emirates', {
    x: width / 2 - 155, y: 33, size: 8, font, color: rgb(0.75, 0.75, 0.75),
  });
  page.drawText(`Thank you for your purchase!  ©${new Date().getFullYear()} Desert Deal`, {
    x: width / 2 - 115, y: 18, size: 8, font, color: rgb(0.75, 0.75, 0.75),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

const generateAdminOrderEmailHTML = (order: OrderConfirmationRequest): string => {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; width: 50px;">
        <img src="${getProductImageUrl(item)}" alt="${item.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" />
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; font-family: Arial, sans-serif;">
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center; font-family: Arial, sans-serif;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right; font-family: Arial, sans-serif;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  const paymentMethodLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5;">
              <!-- Header -->
              <tr>
                <td style="background-color: #1a1a1a; padding: 25px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-family: Arial, sans-serif; font-size: 18px; letter-spacing: 2px;">
                    🚚 NEW ORDER - PACK & SHIP
                  </h1>
                </td>
              </tr>
              
              <!-- Order Details -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #f5f5f5; border-left: 4px solid #1a1a1a; border-radius: 0 8px 8px 0; padding: 15px; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px;">
                      ⚠️ Order Ready for Fulfillment
                    </h2>
                  </div>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    <tr>
                      <td style="padding: 10px; background-color: #f5f5f5; border-radius: 6px;">
                        <strong style="font-family: Arial, sans-serif;">Order Number:</strong>
                        <span style="color: #1a1a1a; font-weight: bold; font-family: Arial, sans-serif; font-size: 18px;"> ${order.order_number}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px;">
                        <strong style="font-family: Arial, sans-serif;">Order Date:</strong>
                        <span style="font-family: Arial, sans-serif;"> ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; background-color: ${order.payment_method === 'cod' ? '#fff3cd' : '#d4edda'}; border-radius: 6px;">
                        <strong style="font-family: Arial, sans-serif;">Payment:</strong>
                        <span style="font-family: Arial, sans-serif; font-weight: bold; color: ${order.payment_method === 'cod' ? '#856404' : '#155724'};"> ${paymentMethodLabel}</span>
                        ${order.payment_method === 'cod' ? '<span style="font-family: Arial, sans-serif; color: #856404;"> - Collect ' + formatCurrency(order.total) + '</span>' : ''}
                      </td>
                    </tr>
                  </table>
                  
                  <h3 style="margin: 0 0 10px; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 15px; border-bottom: 2px solid #1a1a1a; padding-bottom: 5px;">
                    📋 Customer Information
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #f5f5f5; border-radius: 6px;">
                    <tr><td style="padding: 10px; font-family: Arial, sans-serif;"><strong>Name:</strong> ${order.customer_name}</td></tr>
                    <tr><td style="padding: 10px; font-family: Arial, sans-serif;"><strong>Email:</strong> ${order.customer_email}</td></tr>
                  </table>
                  
                  <h3 style="margin: 0 0 10px; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 15px; border-bottom: 2px solid #1a1a1a; padding-bottom: 5px;">
                    📍 Shipping Address
                  </h3>
                  <div style="background-color: #f5f5f5; border-left: 4px solid #1a1a1a; border-radius: 0 8px 8px 0; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                      <strong>${order.customer_name}</strong><br>
                      ${getAddressString(order.shipping_address)}<br>
                      ${order.shipping_address.city}, ${order.shipping_address.state} ${getZipCode(order.shipping_address)}<br>
                      <strong>${order.shipping_address.country || 'UAE'}</strong>
                    </p>
                  </div>
                  
                  <h3 style="margin: 0 0 10px; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 15px; border-bottom: 2px solid #1a1a1a; padding-bottom: 5px;">
                    📦 Items to Pack
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #1a1a1a;">
                        <th style="padding: 12px; width: 50px;"></th>
                        <th style="padding: 12px; text-align: left; font-family: Arial, sans-serif; font-size: 11px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Product</th>
                        <th style="padding: 12px; text-align: center; font-family: Arial, sans-serif; font-size: 11px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                        <th style="padding: 12px; text-align: right; font-family: Arial, sans-serif; font-size: 11px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>${itemsHTML}</tbody>
                  </table>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #f5f5f5; border-radius: 8px; overflow: hidden;">
                    <tr>
                      <td style="padding: 8px 15px; font-family: Arial, sans-serif;">Subtotal</td>
                      <td style="padding: 8px 15px; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(order.subtotal)}</td>
                    </tr>
                    ${order.discount > 0 ? `
                    <tr>
                      <td style="padding: 8px 15px; font-family: Arial, sans-serif; color: #22c55e;">Discount</td>
                      <td style="padding: 8px 15px; text-align: right; font-family: Arial, sans-serif; color: #22c55e;">-${formatCurrency(order.discount)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 8px 15px; font-family: Arial, sans-serif;">Shipping</td>
                      <td style="padding: 8px 15px; text-align: right; font-family: Arial, sans-serif;">${order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}</td>
                    </tr>
                    <tr style="background-color: #1a1a1a;">
                      <td style="padding: 12px 15px; font-family: Arial, sans-serif; font-weight: bold; color: #ffffff; font-size: 16px;">TOTAL</td>
                      <td style="padding: 12px 15px; text-align: right; font-family: Arial, sans-serif; font-weight: bold; color: #ffffff; font-size: 16px;">${formatCurrency(order.total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <tr>
                <td style="background-color: #1a1a1a; padding: 15px; text-align: center;">
                  <p style="margin: 0; color: #999; font-family: Arial, sans-serif; font-size: 11px;">Desert Deal Order Management System</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const generateShippingLabelPDF = async (order: OrderConfirmationRequest): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  const margin = 40;
  const contentWidth = width - margin * 2;
  
  const isPrepaid = order.payment_method !== 'cod';
  const totalAmount = Math.round(order.total);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const orderDate = new Date().toISOString().split('T')[0];
  
  let yPos = height - 50;
  
  // Outer border
  page.drawRectangle({
    x: margin - 10,
    y: 80,
    width: contentWidth + 20,
    height: height - 110,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  // Header - DESERT DEAL
  page.drawText('DESERT DEAL', {
    x: margin,
    y: yPos,
    size: 28,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  yPos -= 18;
  page.drawText('PREMIUM FOOTWEAR', {
    x: margin,
    y: yPos,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Header divider
  yPos -= 15;
  page.drawLine({
    start: { x: margin - 10, y: yPos },
    end: { x: width - margin + 10, y: yPos },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  // Order Info Box
  yPos -= 25;
  const orderBoxY = yPos - 55;
  page.drawRectangle({
    x: margin,
    y: orderBoxY,
    width: contentWidth,
    height: 80,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText(`ORDER: ${order.order_number}`, {
    x: margin + 10,
    y: yPos,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  yPos -= 16;
  page.drawText(`DATE: ${orderDate}`, {
    x: margin + 10,
    y: yPos,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Payment Label Box
  yPos -= 25;
  const paymentLabel = isPrepaid ? `PREPAID : ${formatCurrency(totalAmount)}` : `CASH ON DELIVERY : ${formatCurrency(totalAmount)}`;
  const paymentBoxWidth = paymentLabel.length * 9 + 20;
  
  page.drawRectangle({
    x: margin + 10,
    y: yPos - 8,
    width: paymentBoxWidth,
    height: 25,
    borderColor: rgb(0, 0, 0),
    borderWidth: 3,
  });
  
  page.drawText(paymentLabel, {
    x: margin + 20,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Items count on the right
  page.drawText(`Items: ${itemCount}`, {
    x: width - margin - 60,
    y: yPos + 35,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Address Tables
  yPos = orderBoxY - 20;
  const addressBoxHeight = 130;
  const halfWidth = (contentWidth - 10) / 2;
  
  // Ship To Box
  page.drawRectangle({
    x: margin,
    y: yPos - addressBoxHeight,
    width: halfWidth,
    height: addressBoxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText('SHIP TO', {
    x: margin + 10,
    y: yPos - 18,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawLine({
    start: { x: margin + 10, y: yPos - 23 },
    end: { x: margin + halfWidth - 10, y: yPos - 23 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  let addrY = yPos - 40;
  page.drawText(order.customer_name, {
    x: margin + 10,
    y: addrY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  addrY -= 16;
  page.drawText(getAddressString(order.shipping_address).substring(0, 40), {
    x: margin + 10,
    y: addrY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  addrY -= 14;
  page.drawText(`${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.zipCode || order.shipping_address.pincode || ''}`, {
    x: margin + 10,
    y: addrY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  addrY -= 14;
  page.drawText(order.shipping_address.country || 'UAE', {
    x: margin + 10,
    y: addrY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  addrY -= 14;
  page.drawText(`PHONE: ${order.customer_phone || 'N/A'}`, {
    x: margin + 10,
    y: addrY,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Seller Box
  const sellerX = margin + halfWidth + 10;
  page.drawRectangle({
    x: sellerX,
    y: yPos - addressBoxHeight,
    width: halfWidth,
    height: addressBoxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText('SELLER', {
    x: sellerX + 10,
    y: yPos - 18,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawLine({
    start: { x: sellerX + 10, y: yPos - 23 },
    end: { x: sellerX + halfWidth - 10, y: yPos - 23 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  let sellerY = yPos - 40;
  page.drawText('DESERT DEAL', {
    x: sellerX + 10,
    y: sellerY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  sellerY -= 14;
  page.drawText('United Arab Emirates', {
    x: sellerX + 10,
    y: sellerY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  sellerY -= 14;
  page.drawText('PHONE: +971 50 678 4405', {
    x: sellerX + 10,
    y: sellerY,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Product Table
  yPos = yPos - addressBoxHeight - 30;
  const productColWidth = contentWidth * 0.8;
  const qtyColWidth = contentWidth * 0.2;
  
  // Table header
  page.drawRectangle({
    x: margin,
    y: yPos - 25,
    width: productColWidth,
    height: 25,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  page.drawRectangle({
    x: margin + productColWidth,
    y: yPos - 25,
    width: qtyColWidth,
    height: 25,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText('PRODUCT', {
    x: margin + 10,
    y: yPos - 17,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('QTY', {
    x: margin + productColWidth + 10,
    y: yPos - 17,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Table rows
  yPos -= 25;
  for (const item of order.items) {
    page.drawRectangle({
      x: margin,
      y: yPos - 25,
      width: productColWidth,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });
    page.drawRectangle({
      x: margin + productColWidth,
      y: yPos - 25,
      width: qtyColWidth,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });
    
    page.drawText(item.name.substring(0, 45), {
      x: margin + 10,
      y: yPos - 17,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(String(item.quantity), {
      x: margin + productColWidth + qtyColWidth - 25,
      y: yPos - 17,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPos -= 25;
  }
  
  // Total Box
  yPos -= 20;
  page.drawRectangle({
    x: margin,
    y: yPos - 30,
    width: contentWidth,
    height: 30,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText(`TOTAL : ${formatCurrency(totalAmount)}`, {
    x: width - margin - 130,
    y: yPos - 20,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Return Address Box
  yPos -= 50;
  page.drawRectangle({
    x: margin,
    y: yPos - 60,
    width: contentWidth,
    height: 60,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText('RETURN ADDRESS', {
    x: margin + 10,
    y: yPos - 18,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawLine({
    start: { x: margin + 10, y: yPos - 23 },
    end: { x: margin + 120, y: yPos - 23 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('DESERT DEAL, UAE', {
    x: margin + 20,
    y: yPos - 40,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('United Arab Emirates, PHONE: +971 50 678 4405', {
    x: margin + 70,
    y: yPos - 52,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Footer
  page.drawText('THANK YOU FOR SHOPPING', {
    x: width / 2 - 70,
    y: 100,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This is an internal-only endpoint - verify it's called with service role key
    const authHeader = req.headers.get("authorization");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !supabaseServiceKey || authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderData: OrderConfirmationRequest = await req.json();
    
    // Enrich order items with actual product image URLs from DB
    orderData.items = await enrichItemsWithImages(orderData.items);
    
    console.log("Sending order confirmation for order:", orderData.order_number);

    const emailHTML = generateOrderEmailHTML(orderData);
    
    // Generate PDF invoice for customer
    console.log("Generating PDF invoice...");
    const invoicePdf = await generateInvoicePDF(orderData);
    const invoicePdfBase64 = btoa(String.fromCharCode(...invoicePdf));
    console.log("PDF invoice generated, size:", invoicePdf.length);

    // Generate plain text version for email
    const plainTextEmail = `Thank you for your order, ${orderData.customer_name}!

Order Number: ${orderData.order_number}

Order Summary:
${orderData.items.map(item => `- ${item.name} x${item.quantity}: ${(item.price * item.quantity).toLocaleString()} AED`).join('\n')}

Subtotal: ${orderData.subtotal.toLocaleString()} AED
${orderData.discount > 0 ? `Discount: -${orderData.discount.toLocaleString()} AED\n` : ''}Shipping: ${orderData.shipping === 0 ? 'FREE' : `${orderData.shipping.toLocaleString()} AED`}
Total: ${orderData.total.toLocaleString()} AED

Shipping Address:
${orderData.customer_name}
${getAddressString(orderData.shipping_address)}
${orderData.shipping_address.city}, ${orderData.shipping_address.state} ${getZipCode(orderData.shipping_address)}
${orderData.shipping_address.country || 'UAE'}

Payment Method: ${orderData.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

Your invoice is attached to this email.

For questions, contact us at support@desertsdeals.com

Thank you for shopping with Desert Deal!
`;

    // Send customer confirmation email with PDF invoice
    const emailResponse = await resend.emails.send({
      from: "Desert Deal <orders@desertsdeals.com>",
      to: [orderData.customer_email],
      subject: `Order Confirmed - ${orderData.order_number}`,
      html: emailHTML,
      text: plainTextEmail,
      attachments: [
        {
          filename: `invoice-${orderData.order_number}.pdf`,
          content: invoicePdfBase64,
        },
      ],
    });

    console.log("Customer email sent successfully:", emailResponse);

    // Send admin and shipping notification email for packing and shipping
    const adminOrderEmailRaw = Deno.env.get("ADMIN_ORDER_EMAIL") || "";
    const shippingEmailsRaw = Deno.env.get("SHIPPING_EMAILS") || "";
    
    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    
    const adminEmails = adminOrderEmailRaw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && isValidEmail(e));
    
    const shippingEmails = shippingEmailsRaw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && isValidEmail(e));
    
    // Combine and deduplicate all recipients
    const allRecipients = [...new Set([...adminEmails, ...shippingEmails])];

    console.log("Admin notification recipients configured:", allRecipients.length);

    if (allRecipients.length > 0) {
      try {
        console.log("Generating admin email HTML...");
        const adminEmailHTML = generateAdminOrderEmailHTML(orderData);

        // Generate shipping label PDF
        console.log("Generating shipping label PDF...");
        const shippingLabelPdf = await generateShippingLabelPDF(orderData);
        const shippingLabelBase64 = btoa(String.fromCharCode(...shippingLabelPdf));
        console.log("Shipping label PDF generated, size:", shippingLabelPdf.length);

        const adminPlainText = `New Order Received!

Order: ${orderData.order_number}
Customer: ${orderData.customer_name}
Email: ${orderData.customer_email}
Phone: ${orderData.customer_phone || 'N/A'}
Total: ${orderData.total.toLocaleString()} AED
Payment: ${orderData.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

Items:
${orderData.items.map(item => `- ${item.name} x${item.quantity}`).join('\n')}

Shipping Address:
${getAddressString(orderData.shipping_address)}
${orderData.shipping_address.city}, ${orderData.shipping_address.state}

Invoice and shipping label are attached.
`;

        const sendAdminEmail = async () =>
          await resend.emails.send({
            from: "Desert Deal <notifications@desertsdeals.com>",
            to: allRecipients,
            subject: `🚚 NEW ORDER - ${orderData.order_number} - ${orderData.customer_name}`,
            html: adminEmailHTML,
            text: adminPlainText,
            attachments: [
              {
                filename: `invoice-${orderData.order_number}.pdf`,
                content: invoicePdfBase64,
              },
              {
                filename: `shipping-label-${orderData.order_number}.pdf`,
                content: shippingLabelBase64,
              },
            ],
          });

        console.log("Sending order notification email to:", allRecipients.join(", "));
        let adminResp = await sendAdminEmail();

        // Resend API can rate-limit bursts; do one retry with a short backoff.
        if ((adminResp as any)?.error?.statusCode === 429) {
          console.warn("Rate limited sending admin email; retrying after 650ms...");
          await new Promise((r) => setTimeout(r, 650));
          adminResp = await sendAdminEmail();
        }

        if ((adminResp as any)?.error) {
          console.error("Order notification email failed:", JSON.stringify(adminResp));
        } else {
          console.log("Order notification email sent successfully:", JSON.stringify(adminResp));
        }
      } catch (adminError: any) {
        console.error("Failed to send order notification email:", adminError?.message || adminError);
        console.error("Email error details:", JSON.stringify(adminError));
      }
    } else {
      console.warn("No ADMIN_ORDER_EMAIL or SHIPPING_EMAILS configured, skipping order notification");
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order confirmation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
