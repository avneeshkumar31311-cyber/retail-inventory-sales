import type { RequestHandler } from "express";
import { createProduct, listProducts } from "../services/productService.js";
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
