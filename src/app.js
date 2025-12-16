import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js"

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// CORS
// If you keep frontend on different origin, set credentials and origin properly.
app.use(
  cors({
    origin: "http://localhost:3000", // change to your frontend origin
    credentials: true,
  })
);
// routes
app.use("/api/auth/", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products/", productRoutes)

// global error handler at last after all routes
app.use(errorHandler);

export default app;
