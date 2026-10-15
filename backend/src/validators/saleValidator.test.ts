
import { describe, expect, it } from "vitest";
import { createSaleSchema } from "./saleValidator.js";

describe("createSaleSchema", () => {
  it("accepts valid sale data", () => {
    const result = createSaleSchema.safeParse({
      items: [
        {
          product: "6acf9a938478907783478c17",
          quantity: 2,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty items array", () => {
    expect(createSaleSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it("rejects a fractional quantity", () => {
    expect(
      createSaleSchema.safeParse({
        items: [{ product: "6acf9a938478907783478c17", quantity: 1.5 }],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate products", () => {
    expect(
      createSaleSchema.safeParse({
        items: [
          { product: "6acf9a938478907783478c17", quantity: 1 },
          { product: "6acf9a938478907783478c17", quantity: 2 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid product ID", () => {
    expect(
      createSaleSchema.safeParse({
        items: [{ product: "not-an-id", quantity: 1 }],
      }).success,
    ).toBe(false);
  });
});