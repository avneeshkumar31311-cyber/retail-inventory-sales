import mongoose, { Types } from "mongoose";
import { Product } from "../models/Product.js";
import { Sale, type ISaleItem } from "../models/Sale.js";
import { InvoiceCounter } from "../models/InvoiceCounter.js";
import { InventoryMovement } from "../models/InventoryMovement.js";
import type { UserRole } from "../types/auth.js";
import { AppError } from "../utils/AppError.js";
import { calculateInvoiceTotals } from "../utils/invoiceMath.js";

interface CreateSaleInput {
  items: { product: string; quantity: number }[];
  discountPercent?: number;
  taxPercent?: number;
}

interface SaleActor {
  id: string;
  name: string;
  role: UserRole;
}

interface GetSalesOptions {
  page: number;
  limit: number;
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export async function createSale(
  input: CreateSaleInput,
  actor: SaleActor,
) {
  if (!Types.ObjectId.isValid(actor.id)) {
    throw new AppError("A valid authenticated user is required", 401, "UNAUTHORIZED");
  }

  const session = await mongoose.startSession();

  try {
    let createdSale: unknown;

    await session.withTransaction(async () => {
      const counter = await InvoiceCounter.findOneAndUpdate(
        { _id: "sales" },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, session, setDefaultsOnInsert: true },
      );

      if (!counter) {
        throw new AppError("Unable to generate invoice number", 500, "INVOICE_NUMBER_ERROR");
      }

      const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const invoiceNumber = `INV-${dateKey}-${String(counter.sequence).padStart(6, "0")}`;
      const saleItems: ISaleItem[] = [];
      const movements: Array<Record<string, unknown>> = [];
      let subtotal = 0;

      for (const item of input.items) {
        if (!Types.ObjectId.isValid(item.product)) {
          throw new AppError("Invalid product ID", 400, "INVALID_PRODUCT_ID");
        }

        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            quantity: { $gte: item.quantity },
            isActive: { $ne: false },
          },
          { $inc: { quantity: -item.quantity } },
          { new: true, session, runValidators: true },
        );

        if (!product) {
          const existingProduct = await Product.findById(item.product)
            .select("isActive")
            .session(session);

          if (!existingProduct) {
            throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
          }

          if (existingProduct.isActive === false) {
            throw new AppError("Inactive products cannot be sold", 409, "PRODUCT_INACTIVE");
          }

          throw new AppError(
            `Insufficient stock for product ${item.product}`,
            409,
            "INSUFFICIENT_STOCK",
          );
        }

        const unitPrice = product.sellingPrice ?? product.price;
        const lineSubtotal = roundMoney(unitPrice * item.quantity);
        const unitCost = product.purchasePrice;

        subtotal = roundMoney(subtotal + lineSubtotal);

        saleItems.push({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice,
          ...(unitCost !== undefined ? { unitCost } : {}),
          subtotal: lineSubtotal,
        });

        movements.push({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          type: "SALE",
          quantityChange: -item.quantity,
          quantityBefore: product.quantity + item.quantity,
          quantityAfter: product.quantity,
          reason: `Sale ${invoiceNumber}`,
          ...(unitCost !== undefined ? { unitCost } : {}),
          performedBy: new Types.ObjectId(actor.id),
          performedByName: actor.name,
          performedByRole: actor.role,
        });
      }

      const invoiceTotals = calculateInvoiceTotals(
        subtotal,
        input.discountPercent ?? 0,
        input.taxPercent ?? 0,
      );

      const [sale] = await Sale.create(
        [{
          invoiceNumber,
          items: saleItems,
          subtotal: invoiceTotals.subtotal,
          discountPercent: invoiceTotals.discountPercent,
          discountAmount: invoiceTotals.discountAmount,
          taxPercent: invoiceTotals.taxPercent,
          taxAmount: invoiceTotals.taxAmount,
          totalAmount: invoiceTotals.totalAmount,
          createdBy: new Types.ObjectId(actor.id),
          createdByName: actor.name,
          createdByRole: actor.role,
        }],
        { session },
      );

      await InventoryMovement.create(
        movements.map((movement) => ({
          ...movement,
          referenceSale: sale._id,
          invoiceNumber,
        })),
        { session },
      );

      createdSale = sale;
    });

    return createdSale;
  } finally {
    await session.endSession();
  }
}

export async function getSales({ page, limit }: GetSalesOptions) {
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    Sale.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Sale.countDocuments(),
  ]);

  return {
    sales,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSaleById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid sale ID", 400, "INVALID_SALE_ID");
  }

  const sale = await Sale.findById(id).lean();

  if (!sale) {
    throw new AppError("Sale not found", 404, "SALE_NOT_FOUND");
  }

  return sale;
}

export async function getSalesSummary() {
  const [result] = await Sale.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalSales: { $sum: 1 },
        totalUnitsSold: { $sum: { $sum: "$items.quantity" } },
      },
    },
  ]);

  return {
    totalRevenue: result?.totalRevenue ?? 0,
    totalSales: result?.totalSales ?? 0,
    totalUnitsSold: result?.totalUnitsSold ?? 0,
  };
}
