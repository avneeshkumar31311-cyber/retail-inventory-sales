import { model, Schema } from "mongoose";

export interface IProduct {
  name: string;
  sku: string;

  // Legacy compatibility: mirrors sellingPrice for new products.
  price: number;

  // Optional on legacy records until their data is migrated.
  category?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  isActive?: boolean;

  quantity: number;
  lowStockThreshold: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
    },

    // Keep this field during the compatibility period.
    price: {
      type: Number,
      required: [true, "Product selling price is required"],
      min: [0.01, "Price must be greater than zero"],
    },

    category: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
      default: "Uncategorized",
    },
    purchasePrice: {
      type: Number,
      min: [0, "Purchase price cannot be negative"],
    },
    sellingPrice: {
      type: Number,
      min: [0.01, "Selling price must be greater than zero"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    quantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, "Low-stock threshold cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Low-stock threshold must be a whole number",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Product = model<IProduct>("Product", productSchema);
