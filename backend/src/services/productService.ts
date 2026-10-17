import { Types } from "mongoose";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";

interface CreateProductInput {
  name: string;
  sku: string;
  price?: number;
  category?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  quantity: number;
  lowStockThreshold?: number;
}

type UpdateProductInput = Partial<CreateProductInput> & {
  isActive?: boolean;
};

interface ListProductsOptions {
  page?: number;
  limit?: number;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function normalizeSellingPrice(input: {
  price?: number;
  sellingPrice?: number;
}): number {
  if (
    input.price !== undefined &&
    input.sellingPrice !== undefined &&
    input.price !== input.sellingPrice
  ) {
    throw new AppError(
      "Legacy price must match selling price",
      400,
      "PRICE_MISMATCH",
    );
  }

  const sellingPrice = input.sellingPrice ?? input.price;

  if (sellingPrice === undefined) {
    throw new AppError(
      "A selling price is required",
      400,
      "SELLING_PRICE_REQUIRED",
    );
  }

  return sellingPrice;
}

export async function createProduct(input: CreateProductInput) {
  const sellingPrice = normalizeSellingPrice(input);

  if (
    input.sellingPrice !== undefined &&
    input.purchasePrice === undefined
  ) {
    throw new AppError(
      "Purchase price is required with selling price",
      400,
      "PURCHASE_PRICE_REQUIRED",
    );
  }

  try {
    return await Product.create({
      ...input,
      price: sellingPrice,
      sellingPrice,
      category: input.category ?? "Uncategorized",
      isActive: true,
    });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        "A product with this SKU already exists",
        409,
        "DUPLICATE_SKU",
      );
    }

    throw error;
  }
}

export async function listProducts(
  options: ListProductsOptions = {},
) {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(options.limit ?? 10)),
  );
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
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
  input: UpdateProductInput,
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(
      "Invalid product ID",
      400,
      "INVALID_PRODUCT_ID",
    );
  }

  const changes: UpdateProductInput = { ...input };

  if (
    input.price !== undefined ||
    input.sellingPrice !== undefined
  ) {
    const sellingPrice = normalizeSellingPrice(input);

    // Keep the legacy and new selling-price fields synchronized.
    changes.price = sellingPrice;
    changes.sellingPrice = sellingPrice;
  }

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: changes },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!product) {
      throw new AppError(
        "Product not found",
        404,
        "PRODUCT_NOT_FOUND",
      );
    }

    return product;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isDuplicateKeyError(error)) {
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
    throw new AppError(
      "Invalid product ID",
      400,
      "INVALID_PRODUCT_ID",
    );
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true, runValidators: true },
  );

  if (!product) {
    throw new AppError(
      "Product not found",
      404,
      "PRODUCT_NOT_FOUND",
    );
  }

  return product;
}
