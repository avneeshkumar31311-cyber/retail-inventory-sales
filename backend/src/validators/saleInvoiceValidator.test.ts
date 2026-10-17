import { describe, expect, it } from "vitest";
import { createSaleSchema } from "./saleValidator.js";

const items = [
  { product: "507f1f77bcf86cd799439011", quantity: 2 },
];

describe("sale invoice validation", () => {
  it("accepts discount and tax percentages", () => {
    expect(createSaleSchema.safeParse({
      items,
      discountPercent: 10,
      taxPercent: 18,
    }).success).toBe(true);
  });

  it("remains compatible with existing sale requests", () => {
    expect(createSaleSchema.safeParse({ items }).success).toBe(true);
  });

  it("accepts zero and one-hundred percent boundaries", () => {
    expect(createSaleSchema.safeParse({
      items,
      discountPercent: 0,
      taxPercent: 100,
    }).success).toBe(true);
    expect(createSaleSchema.safeParse({
      items,
      discountPercent: 100,
      taxPercent: 0,
    }).success).toBe(true);
  });

  it("rejects percentages below zero or above one hundred", () => {
    for (const discountPercent of [-0.01, 100.01]) {
      expect(createSaleSchema.safeParse({ items, discountPercent }).success).toBe(false);
    }
    for (const taxPercent of [-1, 101]) {
      expect(createSaleSchema.safeParse({ items, taxPercent }).success).toBe(false);
    }
  });

  it("rejects string values instead of numeric percentages", () => {
    expect(createSaleSchema.safeParse({
      items,
      discountPercent: "10",
    }).success).toBe(false);
  });
});
