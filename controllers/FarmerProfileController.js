import FarmerProfile from "../models/farmerProfileSchema.js";
import userModel from "../models/userSchema.js"; // Assuming userModel is imported correctly
import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import cloudinary from "cloudinary";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Middleware to verify and decode the token
const verifyToken = (token) => {
  if (!token) {
    throw new Error("Please provide a token");
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
  return decoded;
};

// Create or update a farmer profile



export const createOrUpdateFarmerProfile = catchAsyncErrors(async (req, res, next) => {
  const { description, pricePerDay, pricePerMonth, contactDetails, availability } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  // Token validation and decoding
  const decoded = verifyToken(token);
  const userId = decoded.id;

  // Check if the user is a farmer
  if (decoded.role !== "farmer") {
    return next(new ErrorHandler("Only farmers can create or update profiles", 403));
  }

  let profileImage = null;

  // Check if profile image is provided
  if (req.files?.profileImage) {
    const uploadedImage = await cloudinary.uploader.upload(req.files.profileImage.tempFilePath, {
      folder: "FARMER_PROFILE_IMAGES",
    });

    if (!uploadedImage || uploadedImage.error) {
      console.error("Cloudinary Error:", uploadedImage.error || "Unknown error");
      return next(new ErrorHandler("Error uploading profile image", 500));
    }

    profileImage = {
      public_id: uploadedImage.public_id,
      url: uploadedImage.secure_url,
    };
  }

  // Determine profile completeness
  const isCompleteProfile =
    profileImage &&
    description &&
    pricePerDay !== undefined &&
    pricePerMonth !== undefined &&
    contactDetails?.phone &&
    contactDetails?.address;

  const profileData = {
    user: userId,
    profileImage,
    description,
    pricePerDay,
    pricePerMonth,
    contactDetails,
    availability,
    completeProfile: !!isCompleteProfile, // Convert to boolean
  };

  const profile = await FarmerProfile.findOneAndUpdate(
    { user: userId },
    profileData,
    { new: true, upsert: true } // Create new if not exists
  );

  res.status(200).json({ message: "Farmer profile created/updated successfully", profile });
});



// Get all farmer profiles that are available for hire
export const getAllFarmerProfiles = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = verifyToken(token);

  const profiles = await FarmerProfile.find({ availability: true }).populate("user", "name email");

  res.status(200).json({ message: "Farmer profiles retrieved successfully", profiles });
});

// Get a farmer profile by ID
export const getFarmerProfileById = catchAsyncErrors(async (req, res, next) => {
  const { farmerId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = verifyToken(token);

  const profile = await FarmerProfile.findOne({ _id: farmerId })
    .populate("user", "name email") // Populate the farmer's user details
    .populate("hiredBy", "name email"); // Populate the hiredBy field with user details

  if (!profile) {
    return next(new ErrorHandler("Farmer profile not found", 404));
  }

  res.status(200).json({
    message: "Farmer profile retrieved successfully",
    profile,
  });
});



