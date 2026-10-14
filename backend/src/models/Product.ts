import { model, Schema } from "mongoose";

export interface IProduct {
name: string;
sku: string;
price: number;
quantity: number;
lowStockThreshold: number;
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
price: {
type: Number,
required: [true, "Product price is required"],
min: [0.01, "Price must be greater than zero"],
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
