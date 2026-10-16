import type { RequestHandler } from "express";
import { createUser, login } from "../services/authService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

export const loginController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const result = await login(req.body);

    sendSuccess(res, 200, {
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUserController: RequestHandler = (
  req,
  res,
  next,
) => {
  if (!req.authUser) {
    next(
      new AppError(
        "Authentication is required",
        401,
        "UNAUTHORIZED",
      ),
    );
    return;
  }

  sendSuccess(res, 200, {
    message: "Authenticated user retrieved successfully",
    data: { user: req.authUser },
  });
};

export const createUserController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const user = await createUser(req.body);

    sendSuccess(res, 201, {
      message: "User created successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
