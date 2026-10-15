
import { Router } from "express";
import {
  createSaleController,
  getSalesController,
  getSaleByIdController,
  getSalesSummaryController,
} from "../controllers/saleController.js";
import { validateBody } from "../middleware/validate.js";
import { createSaleSchema } from "../validators/saleValidator.js";

const router = Router();

router.post("/", validateBody(createSaleSchema), createSaleController);
router.get("/", getSalesController);
router.get("/summary", getSalesSummaryController);
router.get("/:id", getSaleByIdController);

export default router;