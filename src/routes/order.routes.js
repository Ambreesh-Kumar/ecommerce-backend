import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  createOrderFromCart,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder
} from "../controllers/order.controller.js";

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

export default router;
