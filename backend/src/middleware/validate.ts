
import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError.js";

export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError(
          result.error.issues
            .map((issue) => {
              const field = issue.path.join(".");
              return field
                ? `${field}: ${issue.message}`
                : issue.message;
            })
            .join(", "),
          400,
          "VALIDATION_ERROR",
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}