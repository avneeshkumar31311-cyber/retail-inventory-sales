import { z } from "zod";

const nameSchema = z.string().trim().min(2).max(100);
const skuSchema = z.string().trim().min(1).max(50);
const categorySchema = z.string().trim().min(2).max(50);

const priceSchema = z.number().finite().positive();
const purchasePriceSchema = z.number().finite().min(0);
const quantitySchema = z.number().int().min(0);
const thresholdSchema = z.number().int().min(0);

export const createProductSchema = z
  .object({
    name: nameSchema,
    sku: skuSchema,

    // Legacy clients can still submit "price".
    price: priceSchema.optional(),

    category: categorySchema.default("Uncategorized"),
    purchasePrice: purchasePriceSchema.optional(),
    sellingPrice: priceSchema.optional(),

    quantity: quantitySchema,
    lowStockThreshold: thresholdSchema.default(5),
  })
  .superRefine((data, context) => {
    if (data.price === undefined && data.sellingPrice === undefined) {
      context.addIssue({
        code: "custom",
        path: ["sellingPrice"],
        message: "A selling price is required",
      });
    }

    // New-format product creation must supply the purchase cost.
    // Legacy price-only requests remain supported during migration.
    if (
      data.sellingPrice !== undefined &&
      data.purchasePrice === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["purchasePrice"],
        message: "Purchase price is required with selling price",
      });
    }

    if (
      data.price !== undefined &&
      data.sellingPrice !== undefined &&
      data.price !== data.sellingPrice
    ) {
      context.addIssue({
        code: "custom",
        path: ["price"],
        message: "Legacy price must match selling price",
      });
    }
  });

export const updateProductSchema = z
  .object({
    name: nameSchema.optional(),
    sku: skuSchema.optional(),
    price: priceSchema.optional(),
    category: categorySchema.optional(),
    purchasePrice: purchasePriceSchema.optional(),
    sellingPrice: priceSchema.optional(),
    quantity: quantitySchema.optional(),
    lowStockThreshold: thresholdSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.price === undefined ||
      data.sellingPrice === undefined ||
      data.price === data.sellingPrice,
    {
      path: ["sellingPrice"],
      message: "Legacy price must match selling price",
    },
  )
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update",
  });
