import { Router } from "express";
import {
  createInventoryAdjustmentController,
  getInventoryMovementsController,
  getLowStockController,
} from "../controllers/inventoryController.js";
import { authenticate, requireRole } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { createInventoryAdjustmentSchema } from "../validators/inventoryValidator.js";

const router = Router();

router.get("/low-stock", authenticate, getLowStockController);
router.get("/movements", authenticate, getInventoryMovementsController);
router.post(
  "/adjustments",
  authenticate,
  requireRole("Admin"),
  validateBody(createInventoryAdjustmentSchema),
  createInventoryAdjustmentController,
);

export default router;
