import { Router } from "express";

import {
  createSaleController,
  getSalesController,
  getSaleByIdController,
  getSalesSummaryController,
} from "../controllers/saleController.js";

import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { createSaleSchema } from "../validators/saleValidator.js";

const router = Router();

// Authenticated Admin and Staff can create sales.
// Stock validation and atomic updates remain in the backend controller.
router.post(
  "/",
  authenticate,
  validateBody(createSaleSchema),
  createSaleController,
);

// Sales history and reports require authentication.
router.get("/", authenticate, getSalesController);
router.get("/summary", authenticate, getSalesSummaryController);
router.get("/:id", authenticate, getSaleByIdController);

export default router;
