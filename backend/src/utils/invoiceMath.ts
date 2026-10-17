export interface InvoiceTotals {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function calculateInvoiceTotals(
  subtotal: number,
  discountPercent = 0,
  taxPercent = 0,
): InvoiceTotals {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw new RangeError("Subtotal must be a finite non-negative amount");
  }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new RangeError("Discount percent must be between 0 and 100");
  }
  if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    throw new RangeError("Tax percent must be between 0 and 100");
  }

  const roundedSubtotal = roundMoney(subtotal);
  const discountAmount = roundMoney(roundedSubtotal * discountPercent / 100);
  const taxableAmount = roundMoney(roundedSubtotal - discountAmount);
  const taxAmount = roundMoney(taxableAmount * taxPercent / 100);

  return {
    subtotal: roundedSubtotal,
    discountPercent,
    discountAmount,
    taxPercent,
    taxAmount,
    totalAmount: roundMoney(taxableAmount + taxAmount),
  };
}
