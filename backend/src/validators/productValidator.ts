
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(100),
  sku: z.string().trim().min(1).max(50),
  price: z.number().finite().positive(),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).default(5),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    sku: z.string().trim().min(1).max(50).optional(),
    price: z.number().finite().positive().optional(),
    quantity: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update",
  });