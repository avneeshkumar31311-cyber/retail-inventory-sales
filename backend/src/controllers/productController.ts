import type { RequestHandler } from "express";
import {
  createProduct,
  listProducts,
  updateProduct,
  deleteProduct,
} from "../services/productService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const createProductController: RequestHandler = async (
req,
res,
next,
) => {
try {
const product = await createProduct(req.body);

sendSuccess(res, 201, {
  message: "Product created successfully",
  data: product,
});

} catch (error) {
next(error);
}
};

export const listProductsController: RequestHandler = async (
req,
res,
next,
) => {
try {
const page = Number(req.query.page ?? 1);
const limit = Number(req.query.limit ?? 10);


if (
  !Number.isInteger(page) ||
  page < 1 ||
  !Number.isInteger(limit) ||
  limit < 1 ||
  limit > 100
) {
  res.status(400).json({
    success: false,
    error: {
      code: "INVALID_PAGINATION",
      message: "Page must be a positive integer and limit must be between 1 and 100",
    },
  });
  return;
}

const result = await listProducts({ page, limit });

sendSuccess(res, 200, {
  message: "Products retrieved successfully",
  data: result,
});


} catch (error) {
next(error);
}
};


export const updateProductController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const productId = req.params.id;

if (typeof productId !== "string" || !productId) {
  res.status(400).json({
    success: false,
    error: {
      code: "INVALID_PRODUCT_ID",
      message: "A valid product ID is required",
    },
  });
  return;
}

const product = await updateProduct(productId, req.body);

    sendSuccess(res, 200, {
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const productId = req.params.id;

    if (typeof productId !== "string" || !productId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PRODUCT_ID",
          message: "A valid product ID is required",
        },
      });
      return;
    }

    await deleteProduct(productId);

    sendSuccess(res, 200, {
      message: "Product deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};