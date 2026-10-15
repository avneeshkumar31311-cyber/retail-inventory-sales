
import type { RequestHandler } from "express";
import {createSale,getSales,getSaleById,getSalesSummary,} from "../services/saleService.js";
import { AppError } from "../utils/AppError.js";
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

export const getSalesController: RequestHandler = async (
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
      throw new AppError(
        "Page must be a positive integer and limit must be between 1 and 100",
        400,
        "VALIDATION_ERROR",
      );
    }

    const result = await getSales({ page, limit });

    sendSuccess(res, 200, {
      message: "Sales retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSaleByIdController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const sale = await getSaleById(req.params.id as string);

    sendSuccess(res, 200, {
      message: "Sale retrieved successfully",
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};


export const getSalesSummaryController: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const summary = await getSalesSummary();

    sendSuccess(res, 200, {
      message: "Sales summary retrieved successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};