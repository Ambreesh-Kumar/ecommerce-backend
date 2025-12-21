import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Cart } from "../models/cart.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";

export const createOrderFromCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod = "COD" } = req.body;

  // Validate shipping address
  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.addressLine1 ||
    !shippingAddress.city ||
    !shippingAddress.state ||
    !shippingAddress.pincode
  ) {
    throw new ApiError(400, "Complete shipping address is required");
  }

  // Validate payment method
  if (!["COD", "ONLINE"].includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }

  // Fetch active cart
  const cart = await Cart.findOne({ user: userId, isActive: true });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  let orderItems = [];
  let subtotal = 0;
  let totalItems = 0;

  // Validate products & prepare order items
  for (const item of cart.items) {
    const product = await Product.findOne({
      _id: item.product,
      isActive: true,
    });

    if (!product) {
      throw new ApiError(
        400,
        `Product ${item.productName} is no longer available`
      );
    }

    if (item.quantity > product.stock) {
      throw new ApiError(
        400,
        `Insufficient stock for ${item.productName}`
      );
    }

    const itemSubtotal = item.price * item.quantity;

    orderItems.push({
      product: product._id,
      productName: item.productName,
      productImage: item.productImage,
      price: item.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
    });

    subtotal += itemSubtotal;
    totalItems += item.quantity;

    // Reduce stock
    product.stock -= item.quantity;
    await product.save();
  }

  // Apply discount
  const discount = cart.discount || 0;
  const discountAmount = (subtotal * discount) / 100;
  const totalAmount = subtotal - discountAmount;

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.floor(
    10000 + Math.random() * 90000
  )}`;

  // Create order
  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalItems,
    subtotal,
    totalAmount,
    discount,
    discountAmount,
    paymentMethod,
    shippingAddress,
    orderNumber,
  });

  // Deactivate cart
  cart.isActive = false;
  cart.items = [];
  await cart.save();

  res.status(201).json({
    status: "success",
    message: "Order placed successfully",
    data: order,
  });
});

