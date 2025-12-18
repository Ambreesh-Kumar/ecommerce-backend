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

export const getProducts = asyncHandler(async (req, res) => {
  const query = {
    isActive: true,
  };
  // GET /api/products?q=iphone
  if (req.query.q) {
    const search = req.query.q.trim();
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }
  // GET /api/products?category=ID&brand=Apple&minPrice=50000&maxPrice=100000&page=3&limit=10&sort=brand:asc

  if (req.query.category) {
    if (!mongoose.isValidObjectId(req.query.category)) {
      throw new ApiError(400, "Invalid category id");
    }
    query.category = req.query.category;
  }
  if (req.query.brand) {
    query.brand = new RegExp(`^${req.query.brand}$`, "i");
  }
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) {
      query.price.$gte = Number(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      query.price.$lte = Number(req.query.maxPrice);
    }
  }

  // pagination
  const page = Math.max(Math.ceil(Number(req.query.page)) || 1, 1);
  const limit = Math.max(Math.ceil(Number(req.query.limit)) || 10, 1);
  const skip = (page - 1) * limit;
  const allowedSortFields = ["price", "createdAt", "name", "brand"];
  let sort = {};
  if (req.query.sort) {
    const [field, sortingOrder] = req.query.sort.split(":");
    if (allowedSortFields.includes(field)) {
      if (sortingOrder === "asc" || sortingOrder === "desc") {
        sort[field] = sortingOrder === "asc" ? 1 : -1;
      }
    }
  } else {
    sort = { createdAt: -1 };
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug"),
  ]);
  res.status(200).json({
    status: "success",
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalDocuments: total,
    data: products,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = { isActive: true };
  // If ObjectId → search by _id
  if (mongoose.isValidObjectId(idOrSlug)) {
    query._id = idOrSlug;
  } else {
    // else treat it as slug
    query.slug = idOrSlug.toLowerCase();
  }
  const product = await Product.findOne(query).populate(
    "category",
    "name slug"
  );
  if (!product) throw new ApiError(404, "product not found");
  res.status(200).json({ status: "success", data: product });
});
