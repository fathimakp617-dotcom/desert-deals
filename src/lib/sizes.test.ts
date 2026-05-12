import { describe, it, expect } from "vitest";
import {
  ALL_SIZES,
  KIDS_SIZES,
  JERSEY_SIZES,
  getEuRangeSizes,
  ALL_EU_NUMERIC_FILTER_VALUE,
  formatItemNameWithSize,
} from "@/lib/sizes";

describe("size catalog", () => {
  it("includes EU 47 in the adult size list", () => {
    expect(ALL_SIZES).toContain("EU 47");
  });

  it("does NOT add EU 47 to kids or jersey sizes", () => {
    expect(KIDS_SIZES).not.toContain("EU 47");
    expect(JERSEY_SIZES).not.toContain("EU 47");
  });

  it("EU 40–47 range template includes 47 and excludes 39/48", () => {
    const range = getEuRangeSizes(40, 47);
    expect(range).toContain("EU 47");
    expect(range).toContain("EU 40");
    expect(range).not.toContain("EU 39");
    expect(range).not.toContain("EU 48");
    expect(range).toHaveLength(8);
  });

  it("legacy EU 40–45 template still excludes 47", () => {
    expect(getEuRangeSizes(40, 45)).not.toContain("EU 47");
  });

  it("admin All-Sizes filter value contains 47 as the last numeric token", () => {
    const tokens = ALL_EU_NUMERIC_FILTER_VALUE.split(",");
    expect(tokens).toContain("47");
    expect(tokens[tokens.length - 1]).toBe("47");
  });
});

describe("formatItemNameWithSize (used in invoices and shipping labels)", () => {
  it("appends EU 47 in parentheses after the product name", () => {
    expect(formatItemNameWithSize("Adidas Samba", "EU 47")).toBe(
      "Adidas Samba (EU 47)"
    );
  });

  it("returns name unchanged when size is missing", () => {
    expect(formatItemNameWithSize("Adidas Samba")).toBe("Adidas Samba");
    expect(formatItemNameWithSize("Adidas Samba", null)).toBe("Adidas Samba");
    expect(formatItemNameWithSize("Adidas Samba", "")).toBe("Adidas Samba");
  });
});
