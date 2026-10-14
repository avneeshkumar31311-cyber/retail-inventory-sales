import { Router } from "express";
import {
createProductController,
listProductsController,
} from "../controllers/productController.js";
import { validateBody } from "../middleware/validate.js";
import { createProductSchema } from "../validators/productValidator.js";

const router = Router();

router.post(
"/",
validateBody(createProductSchema),
createProductController,
);

router.get("/", listProductsController);

export default router;
