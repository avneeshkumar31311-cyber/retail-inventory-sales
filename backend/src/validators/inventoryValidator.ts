import { z } from "zod";

export const createInventoryAdjustmentSchema = z.object({
  product: z.string().regex(/^[a-f\d]{24}$/i, {
    message: "Invalid product ID",
  }),
  quantityChange: z.number()
    .int()
    .min(-1000000)
    .max(1000000)
    .refine((value) => value !== 0, {
      message: "Quantity change cannot be zero",
    }),
  reason: z.string().trim().min(3).max(250),
});
