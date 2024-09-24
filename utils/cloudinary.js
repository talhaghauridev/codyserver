const { v2 } = require("cloudinary");
const ErrorHandler = require("./ErrorHandler");
require("dotenv").config();

v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (file, folder, options = {}) => {
  const uploadOptions = {
    folder,
    resource_type: "auto",
    ...options,
  };
  try {
    const response = await v2.uploader.upload(file, {
      ...uploadOptions,
    });

    return response;
  } catch (error) {
    return new ErrorHandler(error, 400);
  }
};

const removeFromCloudinary = async (public_id) => {
  try {
    await v2.uploader.destroy(public_id);
  } catch (error) {
    return new ErrorHandler(error, 400);
  }
};

module.exports = { removeFromCloudinary, uploadCloudinary };
