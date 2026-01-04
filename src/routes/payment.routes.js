import express from "express";
import { auth } from "../middlewares/auth.js";
import { createCheckout } from "../controllers/payment.controller.js";

const router = express.Router();


router.get("/checkout/:orderId", createCheckout);

export default router;
