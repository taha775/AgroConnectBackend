import cloudinary from 'cloudinary';

import {ErrorHandler} from '../utils/ErrorHandler.js'; // Assuming custom error handler
import {catchAsyncErrors} from '../middleware/catchAsyncErrors.js'; // Assuming custom catchAsyncErrors middleware
import { Shop } from "../models/shopSchema.js";
import jwt from "jsonwebtoken"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Controller to handle image upload for shop
export const uploadShopImage = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  // Token validation and decoding
  if (!token) {
    return next(new ErrorHandler("Please provide a token", 400));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(new ErrorHandler("Invalid token", 401));
  }

  const userId = decoded.id;
  const { shop_id } = req.params; // Get shop ID from request params

  console.log("Decoded User ID:", userId);  
  console.log("Shop ID:", shop_id);    

  // Check if the shop exists
  const shop = await Shop.findById(shop_id); // Find shop by ID
  console.log("Shop Found:", shop);  

  if (!shop) {
    return next(new ErrorHandler("Shop not found", 404));
  }

  // Check if the shop belongs to the logged-in user (optional)
  if (shop.owner.toString() !== userId) {
    return next(new ErrorHandler("You are not authorized to upload an image for this shop", 403));
  }

  // Check if an image is provided
  if (!req.files || !req.files.shopImage) {
    return next(new ErrorHandler("Please provide an image file", 400));
  }

  // Upload image to Cloudinary
  const uploadedImage = await cloudinary.uploader.upload(req.files.shopImage.tempFilePath, {
    folder: 'SHOP_IMAGES', // Customize folder name
  });

  if (uploadedImage.error) {
    return next(new ErrorHandler("Error uploading image to Cloudinary", 500));
  }

  // Save the image details in the shop document
  shop.shop_img = {
    public_id: uploadedImage.public_id,
    url: uploadedImage.secure_url,
  };

  await shop.save();

  res.status(200).json({
    success: true,
    message: 'Shop image uploaded successfully',
    shop: {
      name: shop.name,
      shop_id: shop._id,
      shop_img: shop.shop_img,
    },
  });
});





export const getStoreOrders = catchAsyncErrors(async (req, res, next) => {
  const { storeId } = req.params;

  const store = await Shop.findById(storeId).populate({
    path: 'orders',
    populate: {
      path: 'cartItems.productId',
      select: 'name price',
    },
  });

  if (!store) {
    return next(new ErrorHandler("Store not found", 404));
  }

  res.status(200).json({ orders: store.orders });
});



