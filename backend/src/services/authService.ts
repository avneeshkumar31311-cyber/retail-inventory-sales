import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import type { AuthenticatedUser, UserRole } from "../types/auth.js";
import type {
  CreateUserInput,
  LoginInput,
} from "../validators/authValidator.js";
import {
  getJwtSecret,
  JWT_AUDIENCE,
  JWT_EXPIRES_IN_SECONDS,
  JWT_ISSUER,
} from "../config/jwt.js";
import { AppError } from "../utils/AppError.js";

const BCRYPT_ROUNDS = 12;

function toPublicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
}): AuthenticatedUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function login(input: LoginInput) {
  const user = await User.findOne({
    email: input.email,
  }).select("+passwordHash");

  const passwordMatches = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches || !user.isActive) {
    throw new AppError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const token = jwt.sign(
    { tokenType: "access" },
    getJwtSecret(),
    {
      algorithm: "HS256",
      subject: user._id.toString(),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: JWT_EXPIRES_IN_SECONDS,
    },
  );

  return {
    token,
    tokenType: "Bearer",
    expiresIn: JWT_EXPIRES_IN_SECONDS,
    user: toPublicUser(user),
  };
}

export async function createUser(input: CreateUserInput) {
  const passwordHash = await bcrypt.hash(
    input.password,
    BCRYPT_ROUNDS,
  );

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: true,
    });

    return toPublicUser(user);
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        "A user with this email already exists",
        409,
        "EMAIL_IN_USE",
      );
    }

    throw error;
  }
}
