import type { RequestHandler } from "express";
import {
  adjustInventory,
  getInventoryMovements,
  getLowStockProducts,
} from "../services/inventoryService.js";
import type { UserRole } from "../types/auth.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/apiResponse.js";

function getPagination(req: Parameters<RequestHandler>[0]) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (
    !Number.isInteger(page) || page < 1 ||
    !Number.isInteger(limit) || limit < 1 || limit > 100
  ) {
    throw new AppError(
      "Page must be positive and limit must be between 1 and 100",
      400,
      "INVALID_PAGINATION",
    );
  }

  return { page, limit };
}

export const getLowStockController: RequestHandler = async (req, res, next) => {
  try {
    const data = await getLowStockProducts(getPagination(req));
    sendSuccess(res, 200, {
      message: "Low-stock products retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryMovementsController: RequestHandler = async (
  req, res, next,
) => {
  try {
    const pagination = getPagination(req);
    const product = typeof req.query.product === "string"
      ? req.query.product
      : undefined;

    const data = await getInventoryMovements({ ...pagination, product });
    sendSuccess(res, 200, {
      message: "Inventory movements retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createInventoryAdjustmentController: RequestHandler = async (
  req, res, next,
) => {
  try {
    const actor = req.authUser;
    if (!actor) {
      throw new AppError("Authentication is required", 401, "UNAUTHORIZED");
    }

    const data = await adjustInventory(req.body, {
      id: actor.id,
      name: actor.name,
      role: actor.role as UserRole,
    });

    sendSuccess(res, 201, {
      message: "Inventory adjusted successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
