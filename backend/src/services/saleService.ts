
import mongoose, { Types } from "mongoose";
import { Product } from "../models/Product.js";
import { Sale } from "../models/Sale.js";
import { AppError } from "../utils/AppError.js";

interface CreateSaleInput {
  items: {
    product: string;
    quantity: number;
  }[];
}

interface GetSalesOptions {
  page: number;
  limit: number;
}

export async function createSale(input: CreateSaleInput) {
  const session = await mongoose.startSession();

  try {
    let createdSale: unknown;

    await session.withTransaction(async () => {
      const saleItems = [];
      let totalAmount = 0;

      for (const item of input.items) {
        if (!Types.ObjectId.isValid(item.product)) {
          throw new AppError(
            "Invalid product ID",
            400,
            "INVALID_PRODUCT_ID",
          );
        }

        // Atomically reduce stock only when enough units are available.
        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            quantity: { $gte: item.quantity },
          },
          {
            $inc: { quantity: -item.quantity },
          },
          {
            new: true,
            session,
            runValidators: true,
          },
        );

        if (!product) {
          const exists = await Product.exists({
            _id: item.product,
          }).session(session);

          if (!exists) {
            throw new AppError(
              "Product not found",
              404,
              "PRODUCT_NOT_FOUND",
            );
          }

          throw new AppError(
            `Insufficient stock for product ${item.product}`,
            409,
            "INSUFFICIENT_STOCK",
          );
        }

        const subtotal = Number(
          (product.price * item.quantity).toFixed(2),
        );

        totalAmount = Number(
          (totalAmount + subtotal).toFixed(2),
        );

        saleItems.push({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal,
        });
      }

      const [sale] = await Sale.create(
        [
          {
            items: saleItems,
            totalAmount,
          },
        ],
        { session },
      );

      createdSale = sale;
    });

    return createdSale;
  } finally {
    await session.endSession();
  }
}

export async function getSales({
  page,
  limit,
}: GetSalesOptions) {
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    Sale.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
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
    throw new AppError(
      "Invalid sale ID",
      400,
      "INVALID_SALE_ID",
    );
  }

  const sale = await Sale.findById(id).lean();

  if (!sale) {
    throw new AppError(
      "Sale not found",
      404,
      "SALE_NOT_FOUND",
    );
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
        totalUnitsSold: {
          $sum: {
            $sum: "$items.quantity",
          },
        },
      },
    },
  ]);

  return {
    totalRevenue: result?.totalRevenue ?? 0,
    totalSales: result?.totalSales ?? 0,
    totalUnitsSold: result?.totalUnitsSold ?? 0,
  };
}