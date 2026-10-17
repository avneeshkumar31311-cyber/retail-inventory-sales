import mongoose, { Types } from "mongoose";
import { Product } from "../models/Product.js";
import { InventoryMovement } from "../models/InventoryMovement.js";
import type { UserRole } from "../types/auth.js";
import { AppError } from "../utils/AppError.js";

interface Actor {
  id: string;
  name: string;
  role: UserRole;
}

interface ListOptions {
  page: number;
  limit: number;
  product?: string;
}

interface AdjustmentInput {
  product: string;
  quantityChange: number;
  reason: string;
}

export async function getLowStockProducts({ page, limit }: ListOptions) {
  const filter = {
    isActive: { $ne: false },
    $expr: {
      $lte: [
        "$quantity",
        { $ifNull: ["$lowStockThreshold", 5] },
      ],
    },
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ quantity: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getInventoryMovements({
  page,
  limit,
  product,
}: ListOptions) {
  const filter: { product?: Types.ObjectId } = {};

  if (product) {
    if (!Types.ObjectId.isValid(product)) {
      throw new AppError("Invalid product ID", 400, "INVALID_PRODUCT_ID");
    }
    filter.product = new Types.ObjectId(product);
  }

  const [movements, total] = await Promise.all([
    InventoryMovement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    InventoryMovement.countDocuments(filter),
  ]);

  return {
    movements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function adjustInventory(input: AdjustmentInput, actor: Actor) {
  if (!Types.ObjectId.isValid(input.product)) {
    throw new AppError("Invalid product ID", 400, "INVALID_PRODUCT_ID");
  }

  if (!Types.ObjectId.isValid(actor.id)) {
    throw new AppError("Authentication is required", 401, "UNAUTHORIZED");
  }

  const session = await mongoose.startSession();

  try {
    let result: unknown;

    await session.withTransaction(async () => {
      const current = await Product.findById(input.product).session(session);

      if (!current) {
        throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
      }

      const quantityBefore = current.quantity;
      const quantityFilter: Record<string, number> = {
        $eq: quantityBefore,
      };

      if (input.quantityChange < 0) {
        quantityFilter.$gte = Math.abs(input.quantityChange);
      }

      const updated = await Product.findOneAndUpdate(
        {
          _id: current._id,
          quantity: quantityFilter,
        },
        {
          $inc: { quantity: input.quantityChange },
        },
        {
          new: true,
          session,
          runValidators: true,
        },
      );

      if (!updated) {
        throw new AppError(
          "Stock changed during this adjustment or there is insufficient stock",
          409,
          "STOCK_CHANGED",
        );
      }

      const [movement] = await InventoryMovement.create(
        [{
          product: current._id,
          productName: current.name,
          sku: current.sku,
          type: input.quantityChange > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
          quantityChange: input.quantityChange,
          quantityBefore,
          quantityAfter: updated.quantity,
          reason: input.reason.trim(),
          ...(current.purchasePrice !== undefined
            ? { unitCost: current.purchasePrice }
            : {}),
          performedBy: new Types.ObjectId(actor.id),
          performedByName: actor.name,
          performedByRole: actor.role,
        }],
        { session },
      );

      result = { product: updated, movement };
    });

    return result;
  } finally {
    await session.endSession();
  }
}
