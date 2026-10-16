import { Router } from "express";

import {
  createProductController,
  listProductsController,
  updateProductController,
  deleteProductController,
} from "../controllers/productController.js";

import {
  authenticate,
  requireRole,
} from "../middleware/authenticate.js";

import { validateBody } from "../middleware/validate.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidator.js";

const router = Router();

// Both Admin and Staff can view products, but must be authenticated.
router.get("/", authenticate, listProductsController);

// Only Admin can create products.
router.post(
  "/",
  authenticate,
  requireRole("Admin"),
  validateBody(createProductSchema),
  createProductController,
);

// Only Admin can edit products.
router.put(
  "/:id",
  authenticate,
  requireRole("Admin"),
  validateBody(updateProductSchema),
  updateProductController,
);

// Only Admin can delete products.
router.delete(
  "/:id",
  authenticate,
  requireRole("Admin"),
  deleteProductController,
);

export default router;
