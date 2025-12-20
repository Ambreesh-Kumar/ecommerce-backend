import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    brand: { type: String },
    sku: { type: String, required: true, unique: true },
    stock: { type: Number, required: true },
    ratingsAverage: { type: Number, default: 0 },
    ratingsQuantity: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    isActive: { type: Boolean, default: true },
    images: [String], // multiple images
    attributes: { type: mongoose.Schema.Types.Mixed }, // optional dynamic fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes
productSchema.index({ name: 1 });
productSchema.index({ price: 1 });
productSchema.index({ category: 1 });
productSchema.index({ category: 1, price: 1 }); // useful for filtering by category + price

export const Product = mongoose.model("Product", productSchema);
