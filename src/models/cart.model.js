import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false } // no separate _id for subdocuments
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true, // One cart per user
    },
    items: [cartItemSchema],
    totalItems: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0, // e.g., 10 for 10% discount
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0, // calculated discount in currency
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// index for fast lookup
cartSchema.index({ user: 1 });

// Pre-save hook to calculate totals
cartSchema.pre("save", function (next) {
  let totalItems = 0;
  let totalPrice = 0;

  if (this.items && this.items.length > 0) {
    this.items.forEach((item) => {
      item.subtotal = item.price * item.quantity;
      totalItems += item.quantity;
      totalPrice += item.subtotal;
    });
  }

  this.totalItems = totalItems;

  // calculate discount amount
  this.discountAmount = (totalPrice * this.discount) / 100;
  const afterDiscount = totalPrice - this.discountAmount;
  this.totalPrice = Math.max(0, afterDiscount);

  next();
});

export const Cart = mongoose.model("Cart", cartSchema);
