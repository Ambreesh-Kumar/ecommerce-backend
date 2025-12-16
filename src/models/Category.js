import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // category name
    slug: { type: String, required: true, unique: true, lowercase: true }, // URL-friendly name
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
); // automatically adds createdAt & updatedAt

categorySchema.index({slug: 1})

export const Category = mongoose.model("Category", categorySchema);
