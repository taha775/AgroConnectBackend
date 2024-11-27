import userModel from "../models/userSchema.js";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";  // Default import for sendMail
import { ErrorHandler } from "../utils/errorHandler.js";
import sendToken from "../middleware/jwt.js"

// Registration function with role validation
export const registrationUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body;  // Include role from request body
  console.log("Registration process started.");

  // Validate the role (either 'farmer' or 'user')
  if (!['farmer', 'user'].includes(role)) {
    return next( ErrorHandler("Invalid role selection. Please choose either 'farmer' or 'user'.", 400));
  }

  // Check if email already exists
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    return next( ErrorHandler("Email already exists", 400));
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
    return next(ErrorHandler("Authorization header missing or invalid", 401));
  }

  const activation_token = authHeader.split(" ")[1];

  // Verify the activation token and extract the user information
  let newUser;
  try {
    newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
  } catch (error) {
    return next(ErrorHandler("Invalid or expired activation token", 400));
  }

  // Check if the activation code matches the one in the token
  if (newUser.activationCode !== activation_code) {
    return next(ErrorHandler("Invalid activation code", 400));
  }

  const { name, email, password, role } = newUser.user;

  // Check if a user with the given email already exists
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    return next(ErrorHandler("Email already exists", 400));
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
          return next( ErrorHandler("Please enter email and password", 400)); // ErrorHandler is called as a function, not a constructor
      }

      // Find the user by email and include password field in the result
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
          return next( ErrorHandler("Invalid email or password, user not found", 400)); // ErrorHandler is called as a function, not a constructor
      }

      // Check if the password matches the hashed password in the database
      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) {
          return next( ErrorHandler("Invalid email or password", 400)); // ErrorHandler is called as a function, not a constructor
      }

      // If everything is correct, send the JWT 
      sendToken(user,200,res)

  } catch (error) {
      // Catch any errors and pass them to the error handler
      return next( ErrorHandler(error.message, 400)); // ErrorHandler is called as a function, not a constructor
  }
});
