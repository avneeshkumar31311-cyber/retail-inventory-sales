import { model, Schema, Types } from "mongoose";
import type { UserRole } from "../types/auth.js";

export type InventoryMovementType = "SALE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";

export interface IInventoryMovement {
  product: Types.ObjectId;
  productName: string;
  sku: string;
  type: InventoryMovementType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  referenceSale?: Types.ObjectId;
  invoiceNumber?: string;
  unitCost?: number;
  performedBy: Types.ObjectId;
  performedByName: string;
  performedByRole: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["SALE", "ADJUSTMENT_IN", "ADJUSTMENT_OUT"] },
    quantityChange: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "Quantity change must be a whole number",
      },
    },
    quantityBefore: { type: Number, required: true, min: 0 },
    quantityAfter: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true, maxlength: 250 },
    referenceSale: { type: Schema.Types.ObjectId, ref: "Sale" },
    invoiceNumber: { type: String, trim: true },
    unitCost: { type: Number, min: 0 },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedByName: { type: String, required: true, trim: true },
    performedByRole: { type: String, required: true, enum: ["Admin", "Staff"] },
  },
  { timestamps: true, versionKey: false },
);

inventoryMovementSchema.index({ createdAt: -1 });

export const InventoryMovement = model<IInventoryMovement>(
  "InventoryMovement",
  inventoryMovementSchema,
);
