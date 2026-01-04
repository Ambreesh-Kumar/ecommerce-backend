import express from "express";
import { auth } from "../middlewares/auth.js";
import { createCheckout, verifyPayment } from "../controllers/payment.controller.js";

const router = express.Router();


router.get("/checkout/:orderId", createCheckout);
router.post("/verify", verifyPayment);

export default router;
