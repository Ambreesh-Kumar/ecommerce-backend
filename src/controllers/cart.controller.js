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


