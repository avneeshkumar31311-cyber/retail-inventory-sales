
import type { RequestHandler } from "express";
import { createSale } from "../services/saleService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const createSaleController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const sale = await createSale(req.body);

    sendSuccess(res, 201, {
      message: "Sale created successfully",
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};