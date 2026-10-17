import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals } from "./invoiceMath.js";

describe("calculateInvoiceTotals", () => {
  it("calculates discount and tax on the discounted subtotal", () => {
    expect(calculateInvoiceTotals(200, 10, 18)).toEqual({
      subtotal: 200,
      discountPercent: 10,
      discountAmount: 20,
      taxPercent: 18,
      taxAmount: 32.4,
      totalAmount: 212.4,
    });
  });

  it("supports the existing no-discount, no-tax checkout", () => {
    expect(calculateInvoiceTotals(99.99)).toEqual({
      subtotal: 99.99,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 0,
      taxAmount: 0,
      totalAmount: 99.99,
    });
  });

  it("supports a full discount", () => {
    expect(calculateInvoiceTotals(50, 100, 18).totalAmount).toBe(0);
  });

  it("rounds monetary results to two decimal places", () => {
    expect(calculateInvoiceTotals(10.005, 0, 0).subtotal).toBe(10.01);
    expect(calculateInvoiceTotals(10, 12.5, 0).discountAmount).toBe(1.25);
  });

  it("rejects invalid percentages and amounts", () => {
    expect(() => calculateInvoiceTotals(-1)).toThrow(RangeError);
    expect(() => calculateInvoiceTotals(10, -1, 0)).toThrow(RangeError);
    expect(() => calculateInvoiceTotals(10, 101, 0)).toThrow(RangeError);
    expect(() => calculateInvoiceTotals(10, 0, 101)).toThrow(RangeError);
  });
});
