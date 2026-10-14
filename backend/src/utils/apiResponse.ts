
import type { Response } from "express";

interface SuccessResponseOptions<T> {
  message: string;
  data: T;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  options: SuccessResponseOptions<T>,
): Response {
  return res.status(statusCode).json({
    success: true,
    message: options.message,
    data: options.data,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}