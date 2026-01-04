import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/Payment.js";
import { createRazorpayOrder } from "../services/razorpay.service.js";
import { verifyRazorpaySignature } from "../services/razorpay.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const createCheckout = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { token } = req.query;

  if (!token) {
    throw new ApiError(401, "Access token required");
  }

  const userPayload = verifyAccessToken(token);
  const userId = userPayload.userId;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order id");
  }

  const user = await User.findById(userId).select("name email");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // Fetch order
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    paymentMethod: "ONLINE",
    isActive: true,
  });

  if (!order) {
    throw new ApiError(
      404,
      "Order not found or not eligible for online payment"
    );
  }

  // Prevent double payment
 if (order.paymentStatus === "paid") {
  return res.status(400).render("payment-already-paid", {
    orderId: order._id,
    message: "This order has already been paid",
  });
}

// Not eligible for payment
if (order.paymentStatus !== "pending") {
  throw new ApiError(400, "Order not eligible for payment");
}

  const existingPayment = await Payment.findOne({
    order: order._id,
    status: "created",
  });

  if (existingPayment) {
    return res.render("checkout", {
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: order.totalAmount * 100,
      currency: existingPayment.currency,
      razorpayOrderId: existingPayment.razorpayOrderId,
      paymentId: existingPayment._id.toString(),
      orderId: order._id.toString(),
      user: {
        name: user.name,
        email: user.email,
      },
    });
  }

  // Create Razorpay Order (amount from ORDER, not cart)
  const razorpayOrder = await createRazorpayOrder({
    amount: order.totalAmount,
    currency: "INR",
    receipt: order.orderNumber,
  });

  // Create internal payment record (linked to order)
  const payment = await Payment.create({
    user: userId,
    order: order._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount / 100, // stored in INR
    currency: razorpayOrder.currency,
    status: "created",
  });

  // Render checkout page
  res.render("checkout", {
    keyId: process.env.RAZORPAY_KEY_ID,
    amount: razorpayOrder.amount, // paise
    currency: razorpayOrder.currency,
    razorpayOrderId: razorpayOrder.id,
    paymentId: payment._id.toString(), // internal payment id
    orderId: order._id.toString(),
    user: {
      name: user.name,
      email: user.email,
    },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    paymentId,
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  // Validate payload
  if (
    !paymentId ||
    !orderId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    throw new ApiError(400, "Incomplete payment details");
  }

  // Fetch payment
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new ApiError(404, "Payment record not found");
  }

  // Idempotency check
  if (payment.status === "paid") {
    return res.status(200).json({
      status: "success",
      message: "Payment already verified",
    });
  }

  // Verify Razorpay signature
  const isValid = verifyRazorpaySignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!isValid) {
    payment.status = "failed";
    await payment.save();

    throw new ApiError(400, "Invalid payment signature");
  }

  // Update payment
  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  await payment.save();

  // Update order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.paymentStatus = "paid";
  order.orderStatus = "confirmed";
  await order.save();

  // Success
  return res.status(200).json({
    status: "success",
    message: "Payment verified and order confirmed",
  });
});
