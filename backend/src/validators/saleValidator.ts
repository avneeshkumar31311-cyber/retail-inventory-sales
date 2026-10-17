
import { z } from "zod";

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string().regex(/^[a-f\d]{24}$/i, {
          message: "Invalid product ID",
        }),
        quantity: z.number().int().min(1, {
          message: "Quantity must be at least 1",
        }),
      }),
    )
    .min(1, { message: "A sale must contain at least one item" })
    .refine(
      (items) =>
        new Set(items.map((item) => item.product)).size === items.length,
      { message: "Each product may appear only once per sale" },
    ),
  discountPercent: z.number()
    .min(0, { message: "Discount cannot be negative" })
    .max(100, { message: "Discount cannot exceed 100%" })
    .optional(),
  taxPercent: z.number()
    .min(0, { message: "Tax cannot be negative" })
    .max(100, { message: "Tax cannot exceed 100%" })
    .optional(),
});