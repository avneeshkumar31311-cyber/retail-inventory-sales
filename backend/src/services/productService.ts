import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { Types } from "mongoose";
interface CreateProductInput {
name: string;
sku: string;
price: number;
quantity: number;
lowStockThreshold?: number;
}

interface ListProductsOptions {
page?: number;
limit?: number;
}

export async function createProduct(input: CreateProductInput) {
try {
return await Product.create(input);
} catch (error: unknown) {
if (
typeof error === "object" &&
error !== null &&
"code" in error &&
error.code === 11000
) {
throw new AppError(
"A product with this SKU already exists",
409,
"DUPLICATE_SKU",
);
}

throw error;

}
}


export async function listProducts(options: ListProductsOptions = {}) {
const page = Math.max(1, Math.floor(options.page ?? 1));
const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 10)));
const skip = (page - 1) * limit;

const [products, total] = await Promise.all([
Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
Product.countDocuments(),
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

export async function updateProduct(
  id: string,
  input: Partial<CreateProductInput>,
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID", 400, "INVALID_PRODUCT_ID");
  }

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: input },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    return product;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        "A product with this SKU already exists",
        409,
        "DUPLICATE_SKU",
      );
    }

    throw error;
  }
}

export async function deleteProduct(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID", 400, "INVALID_PRODUCT_ID");
  }

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return product;
}
