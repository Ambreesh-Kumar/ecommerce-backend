import express from "express";
import { auth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/role.js";
import {
  createOrderFromCart,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus
} from "../controllers/order.controller.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// All order routes require login
router.use(auth);

// Create order from cart
router.post("/create", createOrderFromCart);
// Get my orders
router.get("/my", getMyOrders);
// Get single order
router.get("/:orderId", getMyOrderById);

// Cancel my order
router.patch("/:orderId/cancel", cancelMyOrder);

// ADMIN ROUTES
router.use(authorize(ROLES.ADMIN));

router.get("/", getAllOrders);
router.get("/admin/:orderId", adminGetOrderById);
router.patch("/admin/:orderId", adminUpdateOrderStatus);

export default router;
