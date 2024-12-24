import userModel from "../models/userSchema.js";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";  // Default import for sendMail
import ErrorHandler  from "../utils/errorHandler.js";
import sendToken from "../middleware/jwt.js"
import { Shop } from "../models/shopSchema.js";
import bcrypt from "bcrypt"

// Registration function with role validation
export const registrationUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body;  // Include role from request body
  console.log("Registration process started.");

  // Validate the role (either 'farmer' or 'user')
  if (!['farmer', 'user'].includes(role)) {
    return next(new ErrorHandler("Invalid role selection. Please choose either 'farmer' or 'user'.", 400));
  }

  // Check if email already exists
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    return next(new ErrorHandler("Email already exists", 400));
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
    return next(new ErrorHandler("Authorization header missing or invalid", 401));
  }

  const activation_token = authHeader.split(" ")[1];

  // Verify the activation token and extract the user information
  let newUser;
  try {
    newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired activation token", 400));
  }

  // Check if the activation code matches the one in the token
  if (newUser.activationCode !== activation_code) {
    return next(new ErrorHandler("Invalid activation code", 400));
  }

  const { name, email, password, role } = newUser.user;

  // Check if a user with the given email already exists
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    return next( new ErrorHandler("Email already exists", 400));
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
          return next(new ErrorHandler("Please enter email and password", 400)); // Instantiate ErrorHandler
      }

      // Find the user by email and include password field in the result
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
          return next(new ErrorHandler("Invalid email or password, user not found", 400)); // Instantiate ErrorHandler
      }

      // Check if the password matches the hashed password in the database
      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) {
          return next(new ErrorHandler("Invalid email or password", 400)); // Instantiate ErrorHandler
      }

      // If credentials are correct, generate a JWT token
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

      // Send the response with the token
      res.status(200).json({
          success: true,
          message: "Login successful",
          user,
          token, // Send token in response
      });

  } catch (error) {
      // Catch any errors and pass them to the error handler
      return next(new ErrorHandler(error.message, 400)); // Instantiate ErrorHandler
  }
});






export const createShop = catchAsyncErrors(async (req, res, next) => {
  // Get the token from the headers (assuming it is sent in the Authorization header as "Bearer <token>")
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; 
  console.log(token);

  if (!token) {
    return next(new ErrorHandler("No token provided, authorization denied", 401));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by decoded token ID
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return next(new ErrorHandler("User not found with this email", 404));
    }

    // Verify the user's role
    if (user.role !== "user") {
      return next(new ErrorHandler("Only users with the 'user' role can create shops", 400));
    }

    const { name, shop_code, password } = req.body;

    // Check if the shop code already exists
    const isShopCodeExists = await Shop.findOne({ shop_code });
    if (isShopCodeExists) {
      return next(new ErrorHandler("Shop code already exists", 400));
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

    // Generate a new token for the shop (shopToken)
    const shopToken = jwt.sign(
      { id: shop._id, shop_code: shop.shop_code }, // payload
      process.env.JWT_SHOP_SECRET, // secret key
      { expiresIn: '10d' } // expiration time (1 hour in this case)
    );

    // Return a successful response along with the new shop token
    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop,
      shopToken, // Send the new shopToken to the client
    });

  } catch (error) {
    return next(new ErrorHandler("Invalid token", 401));
  }
});




export const loginShop = catchAsyncErrors(async (req, res, next) => {
  const { shop_code, password } = req.body;

  // Validate inputs
  if (!shop_code || !password) {
    return next(new ErrorHandler("Please provide shop code and password", 400));
  }

  // Check for the token in the Authorization header
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer <token>

  if (!token) {
    return next(new ErrorHandler("No token provided, shop login not allowed", 401));
  }

  try {
    // Verify the token using the shop's secret (or global secret)
    const decoded = jwt.verify(token, process.env.JWT_SHOP_SECRET);
    console.log(decoded, "Decoded Token");

    // Find the shop by ID from the decoded token data and include password field
    const shop = await Shop.findById(decoded.id).select('+password');
    if (!shop) {
      return next(new ErrorHandler("Invalid shop code or password", 401));
    }

    // Check if the shop code matches the one provided
    if (shop.shop_code !== shop_code) {
      return next(new ErrorHandler("Invalid shop code or password", 400));
    }

    // Manually compare the password using bcrypt.compare
    const isPasswordMatched = await bcrypt.compare(password, shop.password);  // Direct password comparison
    console.log(isPasswordMatched, "Password Match Check");

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid shop code or password", 400));
    }

    // Proceed if the token is valid and password matches
    res.status(200).json({
      success: true,
      message: "Shop logged in successfully",
      shop: {
        name: shop.name,
        shop_code: shop.shop_code,
        owner: shop.owner,
        token
      },
    });

  } catch (error) {
    console.error("Error in loginShop:", error); // Log the error for debugging
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler("Token expired, please login again", 401));
    }
    return next(new ErrorHandler("Invalid token or token expired", 401));
  }
});








