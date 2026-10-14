
import { Router } from "express";

import {
  createProductController,
  listProductsController,
  updateProductController,
  deleteProductController,
} from "../controllers/productController.js";

import { validateBody } from "../middleware/validate.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidator.js";

const router = Router();

router.post(
  "/",
  validateBody(createProductSchema),
  createProductController,
);

router.get("/", listProductsController);

router.put(
  "/:id",
  validateBody(updateProductSchema),
  updateProductController,
);

router.delete("/:id", deleteProductController);

export default router;