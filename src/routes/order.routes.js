import express from "express";
import { auth} from "../middlewares/auth.js";
import { createOrderFromCart } from "../controllers/order.controller.js";

const router = express.Router();

// All order routes require login
router.use(auth);

// Create order from cart
router.post("/create", createOrderFromCart);

export default router;
