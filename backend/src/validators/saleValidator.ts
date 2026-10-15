
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
});