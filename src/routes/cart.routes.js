import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

// All cart routes require login
router.use(auth);

// Cart endpoints
router.get("/", getMyCart);              // Get my cart
router.post("/add", addToCart);          // Add item to cart
router.patch("/update", updateCartItem); // Update item quantity
router.patch("/remove", removeCartItem); // Remove single item from cart
router.delete("/clear", clearCart);      // Clear entire cart

export default router;
