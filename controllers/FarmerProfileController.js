import FarmerProfile from "../models/farmerProfileSchema.js";
import userModel from "../models/userSchema.js"; // Assuming userModel is imported correctly
import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import jwt from "jsonwebtoken";

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
  const { skills, contactDetails, availability } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  // Token validation and decoding
  const decoded = verifyToken(token);

  const userId = decoded.id;

  // Check if the user is a farmer
  if (decoded.role !== "farmer") {
    return next(new ErrorHandler("Only farmers can create or update profiles", 403));
  }

  // Normalize skills if it is a string (add support for multiple skills in an array)
  const formattedSkills = Array.isArray(skills)
    ? skills
    : [{ category: skills, experience: 0 }]; // Default experienceYears to 0 if not provided

  const profileData = { user: userId, skills: formattedSkills, contactDetails, availability };

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

  const profile = await FarmerProfile.findOne({ _id: farmerId }).populate("user", "name email");

  if (!profile) {
    return next(new ErrorHandler("Farmer profile not found", 404));
  }

  res.status(200).json({ message: "Farmer profile retrieved successfully", profile });
});

// Hire a farmer
export const hireFarmer = catchAsyncErrors(async (req, res, next) => {
  const { farmerId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = verifyToken(token);

  const userId = decoded.id;

  // Check if the farmer exists
  const farmer = await FarmerProfile.findById(farmerId);
  if (!farmer) {
    return next(new ErrorHandler("Farmer not found", 404));
  }

  // Update user's hiredFarmers list
  const user = await userModel.findById(userId);
  if (user.hiredFarmers.includes(farmerId)) {
    return next(new ErrorHandler("You have already hired this farmer", 400));
  }

  user.hiredFarmers.push(farmerId);
  await user.save();

  res.status(200).json({
    success: true,
    message: `Farmer ${farmer.user.name} hired successfully`,
    hiredFarmers: user.hiredFarmers,
  });
});

// Get hired farmers for the authenticated user
export const getHiredFarmers = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = verifyToken(token);

  const userId = decoded.id;
  const user = await userModel.findById(userId).populate("hiredFarmers");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Hired farmers retrieved successfully",
    hiredFarmers: user.hiredFarmers,
  });
});
