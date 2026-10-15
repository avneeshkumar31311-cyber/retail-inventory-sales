
import { model, Schema, Types } from "mongoose";

export interface ISaleItem {
  product: Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ISale {
  items: ISaleItem[];
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Sale quantity must be a whole number",
      },
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { _id: false },
);

const saleSchema = new Schema<ISale>(
  {
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (items: ISaleItem[]) => items.length > 0,
        message: "A sale must contain at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Sale = model<ISale>("Sale", saleSchema);