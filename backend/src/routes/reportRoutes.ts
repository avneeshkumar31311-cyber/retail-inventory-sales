import { Router } from "express";
import {
  getProfitDateReportController,
  getSalesDateReportController,
  getTopSellingProductsController,
} from "../controllers/reportController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.get("/sales", authenticate, getSalesDateReportController);
router.get("/top-products", authenticate, getTopSellingProductsController);
router.get("/profit", authenticate, getProfitDateReportController);

export default router;
