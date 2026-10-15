
import { Router } from "express";
import { createSaleController } from "../controllers/saleController.js";
import { validateBody } from "../middleware/validate.js";
import { createSaleSchema } from "../validators/saleValidator.js";

const router = Router();

router.post("/", validateBody(createSaleSchema), createSaleController);

export default router;