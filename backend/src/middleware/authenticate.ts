import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { User } from "../models/User.js";
import type { UserRole } from "../types/auth.js";
import {
  getJwtSecret,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from "../config/jwt.js";
import { AppError } from "../utils/AppError.js";

export const authenticate: RequestHandler = async (
  req,
  _res,
  next,
) => {
  const authorization = req.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next(
      new AppError(
        "A Bearer access token is required",
        401,
        "UNAUTHORIZED",
      ),
    );
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    next(
      new AppError(
        "A Bearer access token is required",
        401,
        "UNAUTHORIZED",
      ),
    );
    return;
  }

  let verified: string | JwtPayload;

  try {
    verified = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    next(
      new AppError(
        "The access token is invalid or expired",
        401,
        "INVALID_TOKEN",
      ),
    );
    return;
  }

  if (
    typeof verified === "string" ||
    typeof verified.sub !== "string" ||
    !Types.ObjectId.isValid(verified.sub) ||
    verified.tokenType !== "access"
  ) {
    next(
      new AppError(
        "The access token is invalid or expired",
        401,
        "INVALID_TOKEN",
      ),
    );
    return;
  }

  try {
    const user = await User.findById(verified.sub).select(
      "_id name email role isActive",
    );

    if (!user || !user.isActive) {
      next(
        new AppError(
          "This user account is inactive or no longer exists",
          401,
          "UNAUTHORIZED",
        ),
      );
      return;
    }

    req.authUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export function requireRole(
  ...allowedRoles: UserRole[]
): RequestHandler {
  return (req, _res, next) => {
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

    if (!allowedRoles.includes(req.authUser.role)) {
      next(
        new AppError(
          "You do not have permission to perform this action",
          403,
          "FORBIDDEN",
        ),
      );
      return;
    }

    next();
  };
}
