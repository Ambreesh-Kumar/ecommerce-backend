import cloudinary from "../config/cloudinary.js";

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return;
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary deleted: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error(`Cloudinary delete failed for ${publicId}:`, error.message);
  }
};
