import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

const BCRYPT_ROUNDS = 12;

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  const password = process.env.SEED_ADMIN_PASSWORD;
  const name =
    process.env.SEED_ADMIN_NAME?.trim() || "RetailSync Admin";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("SEED_ADMIN_EMAIL must be a valid email.");
  }

  if (
    !password ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes.",
    );
  }

  await connectDB();

  const existing = await User.findOne({ email }).select("_id role");

  if (existing) {
    console.log(
      `User ${email} already exists with role ${existing.role}; no changes were made.`,
    );
    return;
  }

  const passwordHash = await bcrypt.hash(
    password,
    BCRYPT_ROUNDS,
  );

  await User.create({
    name,
    email,
    passwordHash,
    role: "Admin",
    isActive: true,
  });

  console.log(`Created Admin user: ${email}`);
}

try {
  await seedAdmin();
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Unknown error";

  console.error(`Admin seed failed: ${message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => undefined);
}
