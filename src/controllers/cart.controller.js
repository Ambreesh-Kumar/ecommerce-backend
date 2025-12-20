import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Cart } from "../models/cart.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { deleteFromCloudinary } from "../utils/deleteCloudinaryPhotos.js";

export const getMyCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId, isActive: true });

  if (!cart) {
    return res.status(200).json({
      status: "success",
      data: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        discount: 0,
        discountAmount: 0,
      },
    });
  }

  res.status(200).json({
    status: "success",
    data: cart,
  });
});

export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity = 1 } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }

  if (quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found or inactive");
  }

  if (quantity > product.stock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  let cart = await Cart.findOne({ user: userId, isActive: true });

  // Create cart if not exists
  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [],
    });
  }

  // Check if product already in cart
  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    if (existingItem.quantity + Number(quantity) > product.stock) {
      throw new ApiError(400, "Requested quantity exceeds available stock");
    }
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({
      product: product._id,
      productName: product.name,
      productImage: product.images?.[0] || "",
      quantity: Number(quantity),
      price: product.discountPrice || product.price,
      subtotal: 0, // recalculated in pre-save hook
    });
  }

  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Product added to cart",
    data: cart,
  });
});
