// Meta Pixel helper – centralises fbq calls with type safety

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const trackViewContent = (params: {
  content_ids: string[];
  content_name: string;
  value: number;
  currency: string;
}) => {
  window.fbq?.("track", "ViewContent", {
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: "product",
    value: params.value,
    currency: params.currency,
  });
};

export const trackAddToCart = (params: {
  content_ids: string[];
  value: number;
  currency: string;
}) => {
  window.fbq?.("track", "AddToCart", {
    content_ids: params.content_ids,
    content_type: "product",
    value: params.value,
    currency: params.currency,
  });
};

export const trackPurchase = (params: {
  order_id: string;
  value: number;
  currency: string;
  content_ids?: string[];
}) => {
  window.fbq?.("track", "Purchase", {
    content_type: "product",
    value: params.value,
    currency: params.currency,
    content_ids: params.content_ids ?? [],
    order_id: params.order_id,
  });
};
