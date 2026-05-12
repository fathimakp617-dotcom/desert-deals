// Canonical size constants and helpers. Single source of truth so tests can
// verify EU 47 (and any new sizes) flow correctly through admin, cart,
// checkout, invoices and shipping labels.

export const ALL_SIZES = [
  "EU 36", "EU 37", "EU 38", "EU 39", "EU 40",
  "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46", "EU 47",
  "Free Size", "Out of Stock",
] as const;

export const KIDS_SIZES = [
  "EU 24", "EU 25", "EU 26", "EU 27", "EU 28", "EU 29",
  "EU 30", "EU 31", "EU 32", "EU 33", "EU 34", "EU 35", "EU 36",
  "Out of Stock",
] as const;

export const JERSEY_SIZES = ["S", "M", "L", "XL", "XXL", "Out of Stock"] as const;

/** Returns EU sizes between min/max inclusive, e.g. getEuRangeSizes(40, 47). */
export const getEuRangeSizes = (min: number, max: number): string[] =>
  ALL_SIZES.filter((s) => {
    if (!s.startsWith("EU ")) return false;
    const n = parseInt(s.replace("EU ", ""), 10);
    return Number.isFinite(n) && n >= min && n <= max;
  });

/** Comma-separated numeric EU values used by the AdminProducts size filter. */
export const ALL_EU_NUMERIC_FILTER_VALUE = "35,36,37,38,39,40,41,42,43,44,45,46,47";

/** How a size is appended to a product name on invoices and shipping slips. */
export const formatItemNameWithSize = (name: string, size?: string | null): string =>
  size ? `${name} (${size})` : name;
