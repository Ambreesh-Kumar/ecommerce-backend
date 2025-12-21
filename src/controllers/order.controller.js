import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Cart } from "../models/cart.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";

export const createOrderFromCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod = "COD" } = req.body;

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

  if (!["COD", "ONLINE"].includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({
      user: userId,
      isActive: true,
    }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    let orderItems = [];
    let subtotal = 0;
    let totalItems = 0;

    for (const item of cart.items) {
      const product = await Product.findOne({
        _id: item.product,
        isActive: true,
      }).session(session);

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

      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    const discount = cart.discount || 0;
    const discountAmount = (subtotal * discount) / 100;
    const totalAmount = subtotal - discountAmount;

    const orderNumber = `ORD-${Date.now()}-${Math.floor(
      10000 + Math.random() * 90000
    )}`;

    const order = await Order.create(
      [
        {
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
        },
      ],
      { session }
    );

    cart.items = [];
    cart.isActive = false;
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      status: "success",
      message: "Order placed successfully",
      data: order[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});


export const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const orders = await Order.find({ user: userId, isActive: true })
    .sort({ createdAt: -1 })
    .lean(); // Give me plain JavaScript objects, NOT full Mongoose documents. improve performance

  if (!orders || orders.length === 0) {
    return res.status(200).json({
      status: "success",
      data: [],
    });
  }

  res.status(200).json({
    status: "success",
    data: orders,
  });
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order id");
  }

  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    isActive: true,
  }).lean();

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res.status(200).json({
    status: "success",
    data: order,
  });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order id");
  }

  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    isActive: true,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Disallow cancellation after shipping
  if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
    throw new ApiError(409, "Order cannot be cancelled at this stage");
  }

  if (order.orderStatus === "cancelled") {
    throw new ApiError(409, "Order already cancelled");
  }

  // Restore stock
  await Promise.all(
    order.items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      })
    )
  );

  order.orderStatus = "cancelled";
  if (order.paymentMethod === "ONLINE") {
    order.paymentStatus = "refunded";
  }
  order.cancelledAt = new Date();
  order.cancelledBy = userId;
  order.isActive = false;

  await order.save();

  res.status(200).json({
    status: "success",
    message: "Order cancelled successfully",
    data: { orderId: order._id },
  });
});
