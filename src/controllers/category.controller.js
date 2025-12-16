import { Category } from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import slugify from "slugify";
import { ROLES } from "../constants/roles.js";
import mongoose from "mongoose";

// Create a new category

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new ApiError(400, "Category name is required");
  const existing = await Category.findOne({ name });
  if (existing) throw new ApiError(400, "Category already exists");
  const category = await Category.create({
    name,
    slug: slugify(name),
    createdBy: req.user._id,
  });

  return res.status(201).json({
    status: "success",
    message: "new category created successfully",
    data: category,
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .select("name slug")
    .sort({ name: 1 });
  res
    .status(200)
    .json({ status: "success", results: categories.length, data: categories });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, isActive } = req.body;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Id");

  const updates = {};

  // update name
  if (name !== undefined) {
    const existing = await Category.findOne({ name, _id: { $ne: id } });
    if (existing) throw new ApiError(400, "Category already exists");
    updates.name = name;
    updates.slug = slugify(name);
  }

  // update active status
  if (isActive !== undefined) {
    updates.isActive = isActive;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "Nothing to update");
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    message: "category updated successfully",
    data: category,
  });
});

// hard delete
export const hardDeleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Id");
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  res.status(200).json({
    status: "success",
    message: "Category deleted successfully",
    data: category,
  });
});

// soft delete

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Id");
  const category = await Category.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: { isActive: false } },
    { new: true, runValidators: true }
  );
  if (!category) {
    throw new ApiError(404, "Category not found or already inactive");
  }

  res.status(200).json({
    status: "success",
    message: "Category deactivated successfully",
    data: category,
  });
});
