import { User } from "../models/User.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // set true in production (https)
  sameSite: isProduction ? "none" : "lax", // adjust if frontend on different domain
  path: "/", // cookie path
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms - must match REFRESH_TOKEN_EXP
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const file = req.file;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }
    let avatarUrl = "";
    let avatarPublicId = "";
    if (file) {
      const cloudRes = await uploadToCloudinary(
        file.buffer,
        "mern_auth_profiles"
      );
      avatarUrl = cloudRes.secure_url;
      avatarPublicId = cloudRes.public_id;
    }
    const user = await User.create({
      name,
      email,
      password,
      avatar: avatarUrl,
      avatarPublicId,
    });
    // create tokens
    const accessToken = createAccessToken(user);
    const refressToken = createRefreshToken(user);

    // set httpOnly refresh cookie
    res.cookie(REFRESH_COOKIE_NAME, refressToken, cookieOptions);
    return res.status(201).json({
      status: "success",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Resister error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const matched = await user.comparePassword(password);
    if (!matched)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
    return res.status(201).json({
      status: "success",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Refresh token endpoint:
 * - Reads httpOnly cookie
 * - Verifies refresh token
 * - Issues a new access token (and rotates refresh token)
 */

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ message: "No refresh token" });

    // verify refresh token
    const payload = verifyRefreshToken(token);

    // find user and check tokenVersion
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (payload.tokenVersion !== user.tokenVersion) {
      // token has been invalidated (e.g., user changed password or admin revoked tokens)
      return res.status(401).json({ message: "Refresh token revoked" });
    }
    // token ok - issue new tokens
    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    // rotate refresh token cookie
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, cookieOptions);
    return res
      .status(200)
      .json({ status: "success", accessToken: newAccessToken });
  } catch (error) {}
};

/**
 * Logout → clear cookie.
 * Optionally you may increment tokenVersion to invalidate all other refresh tokens (global logout).
 */

export const logout = async (req, res) => {
  try {
    // Optionally: increment tokenVersion to invalidate refresh tokens on other devices
    // await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });

    // clear cookie
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    return res.json({ status: "success", message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
