import { describe, expect, it } from "vitest";
import { createProductSchema } from "./productValidator.js";
import { updateProductSchema } from "./productValidator.js";

describe("createProductSchema", () => {
const validProduct = {
name: "Wireless Mouse",
sku: "MOUSE-001",
price: 799,
quantity: 20,
};

it("accepts valid product data and applies defaults", () => {
const result = createProductSchema.safeParse(validProduct);

expect(result.success).toBe(true);

if (result.success) {
  expect(result.data.lowStockThreshold).toBe(5);
}

});

it("rejects a negative price", () => {
const result = createProductSchema.safeParse({
...validProduct,
price: -10,
});

expect(result.success).toBe(false);

});

it("rejects a fractional quantity", () => {
const result = createProductSchema.safeParse({
...validProduct,
quantity: 2.5,
});

expect(result.success).toBe(false);

});
});

describe("updateProductSchema", () => {
  it("accepts a partial product update", () => {
    const result = updateProductSchema.safeParse({
      price: 899,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty update", () => {
    const result = updateProductSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = updateProductSchema.safeParse({
      price: -10,
    });

    expect(result.success).toBe(false);
  });
});