import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import paymentPagesRoutes from "./routes/payment.pages.routes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// CORS
// If you keep frontend on different origin, set credentials and origin properly.
app.use(
  cors({
    origin: process.env.CLIENT_URL === "*" ? true : process.env.CLIENT_URL,
    credentials: true,
  })
);
// routes
app.use("/api/auth/", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products/", productRoutes);
app.use("/api/cart", cartRoutes);
// Order routes
app.use("/api/orders", orderRoutes);
// payment route
app.use("/api/payments", paymentRoutes);
app.use("/", paymentPagesRoutes);

// global error handler at last after all routes
app.use(errorHandler);

export default app;
