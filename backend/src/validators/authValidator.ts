import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("A valid email address is required")
  .max(254);

const passwordByteLimit = (password: string) =>
  Buffer.byteLength(password, "utf8") <= 72;

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .refine(
      passwordByteLimit,
      "Password must be no more than 72 UTF-8 bytes",
    ),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .refine(
      passwordByteLimit,
      "Password must be no more than 72 UTF-8 bytes",
    ),
  role: z.enum(["Admin", "Staff"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
