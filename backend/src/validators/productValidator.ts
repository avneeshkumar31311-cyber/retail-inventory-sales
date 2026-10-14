
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(100),
  sku: z.string().trim().min(1).max(50),
  price: z.number().finite().positive(),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).default(5),
});