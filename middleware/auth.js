// import { User } from "../models/userSchema.js";    
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken"



export const isAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];  // Extract token from Bearer header
  
  if (!token) {
    return next(new ErrorHandler('No token provided. Please authenticate.', 401));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Attach the user information to the request object for later use
    req.user = decoded;
    next();
  } catch (error) {
    return next(new ErrorHandler('Token is not valid or expired', 401));
  }
};





export const authorizesRoles = (...roles) => {
  return (req, res, next) => {
    // Assuming req.user is populated by the isAuthenticated middleware
    const { user } = req;

    if (!user) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!roles.includes(user.role)) {
      return next(new ErrorHandler(`Role (${user.role}) is not authorized to access this resource`, 403));
    }

    next();
  };
};

