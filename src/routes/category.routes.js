import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  hardDeleteCategory
} from "../controllers/category.controller.js";
import { auth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/role.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get("/", getCategories);
// Admin only routes
router.use(auth, authorize(ROLES.ADMIN));
router.post("/", createCategory);
router.put("/:id", updateCategory)
router.patch("/:id", deleteCategory);
router.delete("/:id", hardDeleteCategory)

export default router;
