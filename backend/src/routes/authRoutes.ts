import { Router } from "express";
import {
  createUserController,
  getCurrentUserController,
  loginController,
} from "../controllers/authController.js";
import {
  authenticate,
  requireRole,
} from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import {
  createUserSchema,
  loginSchema,
} from "../validators/authValidator.js";

const router = Router();

router.post(
  "/login",
  validateBody(loginSchema),
  loginController,
);

router.get(
  "/me",
  authenticate,
  getCurrentUserController,
);

router.post(
  "/users",
  authenticate,
  requireRole("Admin"),
  validateBody(createUserSchema),
  createUserController,
);

export default router;
