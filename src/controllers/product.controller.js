import mongoose from "mongoose";
import slugify from "slugify";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    discountPrice,
    brand,
    stock,
    category,
    attributes,
  } = req.body;

  // Required field validation (0-safe)
  if (
    !name ||
    !description ||
    price === undefined ||
    stock === undefined ||
    !category
  ) {
    throw new ApiError(400, "All required product fields must be provided");
  }

  // Category validation
  if (!mongoose.isValidObjectId(category)) {
    throw new ApiError(400, "Invalid category id");
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) throw new ApiError(404, "Category not found");
  if (!categoryExists.isActive) {
    throw new ApiError(400, "Category is not active");
  }

  // Slug
  const slug = slugify(name, { lower: true });

  // Duplicate product check (per category)
  const existingProduct = await Product.findOne({ slug, category });
  if (existingProduct) {
    throw new ApiError(400, "Product already exists in this category");
  }

  // Discount validation
  if (discountPrice !== undefined && discountPrice >= price) {
    throw new ApiError(400, "Discount price must be less than price");
  }
  // price & stock validation
  if (price < 0 || stock < 0) {
    throw new ApiError(400, "Price and stock must be positive numbers");
  }

  // safe attributes parsing
  let attributesObj = {};
  if (attributes) {
    try {
      attributesObj = JSON.parse(attributes);
    } catch {
      throw new ApiError(400, "Invalid attributes format");
    }
  }

  // 🔹 Upload images to Cloudinary
  if (req.files?.length > 10) {
    throw new ApiError(400, "Maximum 10 images allowed");
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, "products")
    );

    const uploadResults = await Promise.all(uploadPromises);
    images = uploadResults.map((result) => result.secure_url);
  }

  // Temporary SKU
  const sku = `SKU-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const product = await Product.create({
    name,
    slug,
    description,
    price,
    discountPrice,
    brand,
    sku,
    stock,
    images,
    category,
    attributes: attributesObj,
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: "success",
    message: "Product created successfully",
    data: product,
  });
});
