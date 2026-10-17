import { describe, expect, it } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
} from "./productValidator.js";

describe("createProductSchema", () => {
  const legacyProduct = {
    name: "Wireless Mouse",
    sku: "MOUSE-001",
    price: 799,
    quantity: 20,
  };

  it("accepts legacy product data and applies defaults", () => {
    const result = createProductSchema.safeParse(legacyProduct);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.lowStockThreshold).toBe(5);
      expect(result.data.category).toBe("Uncategorized");
      expect(result.data.price).toBe(799);
    }
  });

  it("accepts the new category and pricing fields", () => {
    const result = createProductSchema.safeParse({
      name: "Wireless Mouse",
      sku: "MOUSE-002",
      category: "Electronics",
      purchasePrice: 500,
      sellingPrice: 799,
      quantity: 20,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a negative legacy price", () => {
    const result = createProductSchema.safeParse({
      ...legacyProduct,
      price: -10,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a fractional quantity", () => {
    const result = createProductSchema.safeParse({
      ...legacyProduct,
      quantity: 2.5,
    });

    expect(result.success).toBe(false);
  });

  it("requires purchase price with new-format selling price", () => {
    const result = createProductSchema.safeParse({
      name: "Wireless Mouse",
      sku: "MOUSE-003",
      category: "Electronics",
      sellingPrice: 799,
      quantity: 20,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative purchase price", () => {
    const result = createProductSchema.safeParse({
      name: "Wireless Mouse",
      sku: "MOUSE-004",
      category: "Electronics",
      purchasePrice: -10,
      sellingPrice: 799,
      quantity: 20,
    });

    expect(result.success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("accepts a partial legacy update", () => {
    const result = updateProductSchema.safeParse({
      price: 899,
    });

    expect(result.success).toBe(true);
  });

  it("accepts category and pricing updates", () => {
    const result = updateProductSchema.safeParse({
      category: "Accessories",
      purchasePrice: 600,
      sellingPrice: 899,
    });

    expect(result.success).toBe(true);
  });

  it("accepts an active status update", () => {
    const result = updateProductSchema.safeParse({
      isActive: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a negative legacy price", () => {
    expect(
      updateProductSchema.safeParse({ price: -10 }).success,
    ).toBe(false);
  });
});
