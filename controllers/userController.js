import userModel from "../models/userSchema.js";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import jwt, { decode } from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";  // Default import for sendMail
import {errorHandler} from '../errorHandler.js';

import { Shop } from "../models/shopSchema.js";
import bcryptjs from "bcryptjs"
import FarmerProfile from "../models/farmerProfileSchema.js";
import cloudinary from "cloudinary";



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log(import.meta.url);


// Registration function with role validation
export const registrationUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body;  // Include role from request body
  console.log("Registration process started.");

  // Validate the role (either 'farmer' or 'user')
  if (!['farmer', 'user'].includes(role)) {
    return next(new errorHandler("Invalid role selection. Please choose either 'farmer' or 'user'.", 400));
  }

  // Check if email already exists
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    return next(new errorHandler("Email already exists", 400));
  }

  // Create user object and activation token
  const user = { name, email, password, role };  // Include role when creating user
  const activationToken = createActivationToken(user);
  const activationCode = activationToken.activationCode;

  const data = { user: { name: user.name }, activationCode };
  console.log("Activation token created");

  // Send activation email
  await sendMail({
    email: user.email,
    subject: "Activate your Account",
    template: "activation-mail.ejs",  // Ensure the template path is correct
    data,
  });

  // Send response
  res.status(201).json({
    success: true,
    message: `Please check your email ${user.email} to activate your account.`,
    activationToken: activationToken.token,
  });
});


// Function to create the activation token
export const createActivationToken = (user) => {
  // Generate a random 4-digit activation code
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Create the token with the user data and activation code
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET, // Secret key from environment variables
    { expiresIn: "5m" } // Token expiry time
  );

  // Return the token and activation code
  return { token, activationCode };
};



// Activation user function
export const activateUser = catchAsyncErrors(async (req, res, next) => {
  const { activation_code } = req.body;

  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new errorHandler("Authorization header missing or invalid", 401));
  }

  const activation_token = authHeader.split(" ")[1];

  // Verify the activation token and extract the user information
  let newUser;
  try {
    newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
  } catch (error) {
    return next(new errorHandler("Invalid or expired activation token", 400));
  }

  // Check if the activation code matches the one in the token
  if (newUser.activationCode !== activation_code) {
    return next(new errorHandler("Invalid activation code", 400));
  }

  const { name, email, password, role } = newUser.user;

  // Check if a user with the given email already exists
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    return next( new errorHandler("Email already exists", 400));
  }

  // Create a new user in the database
  const user = await userModel.create({
    name,
    email,
    password,
    role,
  });

  // Return a successful response
  res.status(201).json({
    success: true,
    message: "User activated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});




export const LoginUser = catchAsyncErrors(async (req, res, next) => {
  try {
      const { email, password } = req.body; // Destructure email and password from request body

      // Check if email or password is missing
      if (!email || !password) {
          return next(new errorHandler("Please enter email and password", 400)); // Instantiate errorHandler
      }

      // Find the user by email and include password field in the result
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
          return next(new errorHandler("Invalid email or password, user not found", 400)); // Instantiate errorHandler
      }

      // Check if the password matches the hashed password in the database
      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) {
          return next(new errorHandler("Invalid email or password", 400)); // Instantiate errorHandler
      }

      // If credentials are correct, generate a JWT token
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

      // Send the response with the token
      res.status(200).json({
          success: true,
          message: "Login successful",
          user,
          avatar:user.avatar,
          token, // Send token in response
      });

  } catch (error) {
      // Catch any errors and pass them to the error handler
      return next(new errorHandler(error.message, 400)); // Instantiate errorHandler
  }
});

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

import fs from "fs"; // Import fs to handle file deletion

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    // Token validation and decoding
    if (!token) {
      return next(new errorHandler("Please provide a token", 400));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return next(new errorHandler("Invalid token", 401));
    }
    const userId = decoded.id;

    // Fetch user from the database
    let user = await userModel.findById(userId);
    if (!user) {
      return next(new errorHandler("User not found", 404));
    }

    // Log files to ensure profile image is being sent
    console.log("Received Files:", req.files);

    // Check if a new profile image is provided
    if (!req.files || !req.files.profileImage) {
      return next(new errorHandler("Please provide an image file", 400));
    }

    // Upload image to Cloudinary
    const uploadedImage = await cloudinary.uploader.upload(req.files.profileImage.tempFilePath, {
      folder: "USER_PROFILE_IMAGES",
    });

    console.log("Cloudinary Response:", uploadedImage);

    if (!uploadedImage || uploadedImage.error) {
      return next(new errorHandler("Error uploading image to Cloudinary", 500));
    }

    // Update user avatar field
    user.profileImage = {
      public_id: uploadedImage.public_id,
      url: uploadedImage.secure_url,
    };
    
    // Save updated user profile
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      user,
      avatar: user.avatar, // Ensure avatar is included in the response
    });

  } catch (error) {
    console.error("❌ Error updating profile:", error);
    return next(new errorHandler(error.message, 500));
  }
});




export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  try {
    // Fetch all users, excluding the password field for security
    const users = await userModel.find().select("-password");

    if (!users || users.length === 0) {
      return next(new errorHandler("No users found", 404));
    }

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });

  } catch (error) {
    return next(new errorHandler(error.message, 500));
  }
});


// Get specific user profile by ID
export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.params.id; // Get user ID from request params

    const user = await userModel.findById(userId)
      .select("-password") // Exclude password field
      .populate({
        path: 'hiredFarmers',
        populate: {
          path: 'user', // If farmers reference a user document
        },
      }); // Populate hired farmers

    if (!user) {
      return next(new errorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new errorHandler(error.message, 500));
  }
});



export const createShop = catchAsyncErrors(async (req, res, next) => {
  // Get the token from the headers (assuming it is sent in the Authorization header as "Bearer <token>")
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; 
  console.log(token);

  if (!token) {
    return next(new errorHandler("No token provided, authorization denied", 401));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by decoded token ID
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return next(new errorHandler("User not found with this email", 404));
    }

    // Verify the user's role
    if (user.role !== "user") {
      return next(new errorHandler("Only users with the 'user' role can create shops", 400));
    }

    const { name, shop_code, password } = req.body;

    // Check if the shop code already exists
    const isShopCodeExists = await Shop.findOne({ shop_code });
    if (isShopCodeExists) {
      return next(new errorHandler("Shop code already exists", 400));
    }

    // Create a new shop and associate it with the user
    const shop = await Shop.create({
      name,
      shop_code,
      password,
      owner: user._id, // Associate the shop with the user
    });

    // Update the user's shops array
    user.shops.push(shop._id);
    await user.save();


 
    // Return a successful response along with the new shop token
    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop,
 
    });

  } catch (error) {
    return next(new errorHandler("Invalid token", 401));
  }
});




export const loginShop = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  // Validate the token input
  if (!token) {
    return next(new errorHandler("Please provide a token", 400));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded.id, "Decoded Token");

    const { shop_code, password } = req.body;

    // Find the shop by `shop_code` and `owner` from the decoded token's ID
    const shop = await Shop.findOne({ shop_code, owner: decoded.id }).select("+password");

    if (!shop) {
      return next(new errorHandler("Shop not found for this user", 404));
    }

    // Compare the provided password with the hashed password in DB
    const isPasswordMatched = await bcryptjs.compare(password, shop.password);
    if (!isPasswordMatched) {
      return next(new errorHandler("Invalid shop_code or password", 401));
    }

    // Proceed with the login process
    res.status(200).json({
      success: true,
      message: "Shop logged in successfully",
      shop
    });
  } catch (error) {
    console.error("Error in loginShop:", error); // Log the error for debugging
    if (error.name === "TokenExpiredError") {
      return next(new errorHandler("Token expired, please login again", 401));
    }
    return next(new errorHandler("Invalid token", 401));
  }
});


export const getAllShopsWithProducts = catchAsyncErrors(async (req, res, next) => {
  try {
    const shops = await Shop.find().populate("products");

    if (!shops || shops.length === 0) {
      return next(new errorHandler("No shops found", 404));
    }

    res.status(200).json({
      success: true,
      shops,
    });
  } catch (error) {
    return next(new errorHandler("Error fetching shops", 500));
  }
});

export const getShopById = catchAsyncErrors(async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate("products");

    if (!shop) {
      return next(new errorHandler("Shop not found", 404));
    }

    res.status(200).json({
      success: true,
      shop,
    });
  } catch (error) {
    return next(new errorHandler("Error fetching shop details", 500));
  }
});





export const hireFarmer = catchAsyncErrors(async (req, res, next) => {
  const { farmerId } = req.params;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return next(new errorHandler("No token provided, authorization denied", 401));
  }

  // Verify the token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new errorHandler("Invalid or expired token", 403));
  }

  const userId = decoded.id;

  // Check if the farmer exists
  const farmer = await FarmerProfile.findById(farmerId).populate("user", "name email"); // Populate the user field

  if (!farmer) {
    return next(new errorHandler("Farmer not found", 404));
  }

  // Check if the user has already hired the farmer (optional)
  const user = await userModel.findById(userId);

  if (user.hiredFarmers.includes(farmerId)) {
    return next(new errorHandler("You have already hired this farmer", 400));
  }

  // Add farmer to the user's hiredFarmers list
  user.hiredFarmers.push(farmerId);
  await user.save();
  farmer.hiredBy.push(userId)
  farmer.save()

  res.status(200).json({
    success: true,
    message: `Farmer ${farmer.user.name} hired successfully`,
    hiredFarmers: user.hiredFarmers,
    farmerData: farmer.user,

  });
});




export const getHiredFarmers = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Get token from headers

  if (!token) {
    return next(new errorHandler("No token provided, authorization denied", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token using the JWT_SECRET
  } catch (err) {
    return next(new errorHandler("Invalid or expired token", 403));
  }

  const userId = decoded.id; // Get the user ID from the decoded token

  // Find the user and populate the hiredFarmers field with details from FarmerProfile model
  const user = await userModel.findById(userId).populate({
    path: 'hiredFarmers', // Populate the hiredFarmers array
    populate: {
      path: 'user', // Populate the user details from FarmerProfile
      select: 'name email', // Select only the necessary fields (name, email)
    }
  });

  if (!user) {
    return next(new errorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Hired farmers retrieved successfully",
    hiredFarmers: user.hiredFarmers, // This will contain the populated data for hired farmers
  });
});








export const getHiredFarmersByUserId = catchAsyncErrors(async (req, res, next) => {
  const { user_id } = req.params; // Get user_id from request body

  if (!user_id) {
    return next(new errorHandler("User ID is required", 400));
  }

  // Find the user and populate the hiredFarmers field with details from the FarmerProfile model
  const user = await userModel.findById(user_id).populate({
    path: 'hiredFarmers', // Populate the hiredFarmers array
    populate: {
      path: 'user', // Populate the user details from FarmerProfile
      select: 'name email', // Select only the necessary fields (name, email)
    }
  });

  if (!user) {
    return next(new errorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Hired farmers retrieved successfully",
    hiredFarmers: user.hiredFarmers, // This will contain the populated data for hired farmers
  });
});













