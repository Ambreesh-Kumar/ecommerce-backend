import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance with API key & secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async ({ amount, currency = "INR", receipt }) => {
  // amount in smallest currency unit (paise for INR)
  const options = {
    amount: amount * 100, // Convert rupees to paise
    currency,
    receipt,
  };

  const order = await razorpay.orders.create(options);
  return order; // returns razorpay_order_id, amount, currency, etc.
};

export const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest("hex");

  return generatedSignature === razorpay_signature; // true if valid
};
