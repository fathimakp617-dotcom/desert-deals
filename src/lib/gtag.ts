// Google Ads gtag.js helper — centralises gtag calls with type safety
// The actual gtag.js script is loaded in index.html
// Replace 'AW-XXXXXXXXXX' with your real Google Ads conversion ID

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Track a Google Ads purchase conversion.
 * Call this after a successful order (alongside Meta Pixel tracking).
 */
export const trackGoogleAdsConversion = (params: {
  transaction_id: string;
  value: number;
  currency: string;
  items?: Array<{ id: string; name: string; price: number; quantity: number }>;
}) => {
  // Only fire if gtag is loaded and conversion ID is set
  if (!window.gtag) return;

  window.gtag("event", "conversion", {
    send_to: "AW-CONVERSION_ID/CONVERSION_LABEL", // User must replace with real values
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency,
  });

  // Also send to GA4 if configured
  window.gtag("event", "purchase", {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency,
    items: params.items?.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
};

/**
 * Track add to cart event for Google Ads remarketing
 */
export const trackGoogleAdsAddToCart = (params: {
  item_id: string;
  item_name: string;
  value: number;
  currency: string;
}) => {
  if (!window.gtag) return;

  window.gtag("event", "add_to_cart", {
    currency: params.currency,
    value: params.value,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.value,
        quantity: 1,
      },
    ],
  });
};

/**
 * Track product view for Google Ads remarketing
 */
export const trackGoogleAdsViewItem = (params: {
  item_id: string;
  item_name: string;
  value: number;
  currency: string;
}) => {
  if (!window.gtag) return;

  window.gtag("event", "view_item", {
    currency: params.currency,
    value: params.value,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.value,
        quantity: 1,
      },
    ],
  });
};
