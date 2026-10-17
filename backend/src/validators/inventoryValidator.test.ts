import { describe, expect, it } from "vitest";
import { createInventoryAdjustmentSchema } from "./inventoryValidator.js";

const validAdjustment = {
  product: "507f1f77bcf86cd799439011",
  quantityChange: -2,
  reason: "Damaged units removed",
};

describe("inventory adjustment validation", () => {
  it("accepts positive and negative whole-unit adjustments", () => {
    expect(createInventoryAdjustmentSchema.safeParse({
      ...validAdjustment,
      quantityChange: 5,
    }).success).toBe(true);

    expect(createInventoryAdjustmentSchema.safeParse(validAdjustment).success).toBe(true);
  });

  it("rejects zero and fractional adjustments", () => {
    expect(createInventoryAdjustmentSchema.safeParse({
      ...validAdjustment,
      quantityChange: 0,
    }).success).toBe(false);

    expect(createInventoryAdjustmentSchema.safeParse({
      ...validAdjustment,
      quantityChange: 1.5,
    }).success).toBe(false);
  });

  it("rejects invalid product IDs", () => {
    expect(createInventoryAdjustmentSchema.safeParse({
      ...validAdjustment,
      product: "not-a-product-id",
    }).success).toBe(false);
  });

  it("requires a useful reason", () => {
    expect(createInventoryAdjustmentSchema.safeParse({
      ...validAdjustment,
      reason: "ok",
    }).success).toBe(false);
  });
});
