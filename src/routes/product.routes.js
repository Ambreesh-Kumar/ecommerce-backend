import express from "express";
import { auth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/role.js";
import { ROLES } from "../constants/roles.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,
  hardDeleteProduct
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

// public route
router.get("/", getProducts);
router.get("/:idOrSlug", getProductById);

router.use(auth, authorize(ROLES.ADMIN));
// protected routes for admin
router.post("/", upload.array("images", 10), createProduct);
router.put("/:productId", upload.array("images", 10), updateProduct);
router.patch("/:productId", deleteProduct); // soft delete
router.delete("/:productId/hard", hardDeleteProduct); // hard delete
router.patch("/:productId/restore", restoreProduct); // restore

export default router;
