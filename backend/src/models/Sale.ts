import { model, Schema, Types } from "mongoose";
import type { UserRole } from "../types/auth.js";

export interface ISaleItem {
  product: Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  subtotal: number;
}

export interface ISale {
  invoiceNumber?: string;
  items: ISaleItem[];
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  totalAmount: number;
  createdBy?: Types.ObjectId;
  createdByName?: string;
  createdByRole?: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Sale quantity must be a whole number",
      },
    },
    unitPrice: { type: Number, required: true, min: 0.01 },
    unitCost: { type: Number, min: 0 },
    subtotal: { type: Number, required: true, min: 0.01 },
  },
  { _id: false },
);

const saleSchema = new Schema<ISale>(
  {
    invoiceNumber: { type: String, trim: true, unique: true, sparse: true },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (items: ISaleItem[]) => items.length > 0,
        message: "A sale must contain at least one item",
      },
    },
    subtotal: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100 },
    discountAmount: { type: Number, min: 0 },
    taxPercent: { type: Number, min: 0, max: 100 },
    taxAmount: { type: Number, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String, trim: true },
    createdByRole: { type: String, enum: ["Admin", "Staff"] },
  },
  { timestamps: true, versionKey: false },
);

export const Sale = model<ISale>("Sale", saleSchema);
