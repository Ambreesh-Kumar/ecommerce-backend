import express from "express";
import { getMyCart, addToCart } from "../controllers/cart.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// All cart routes require login
router.use(auth);

// GET my cart
router.get("/", getMyCart);

// ADD item to cart
router.post("/add", addToCart);

export default router;
