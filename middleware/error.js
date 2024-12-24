import ErrorHandler from "../utils/errorHandler.js";

const errorMiddleware = (err, req, res, next) => {
  // Handle duplicate key error (e.g., unique index constraint violation)
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
    err = new ErrorHandler(message, 400);
  }

  // Handle invalid JWT error
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid. Try again.`;
    err = new ErrorHandler(message, 400);
  }

  // Handle expired JWT error
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token has expired. Please login again.`;
    err = new ErrorHandler(message, 400);
  }

  // Handle CastError (e.g., invalid MongoDB ObjectId format)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;
    err = new ErrorHandler(message, 400);
  }

  // Handle mongoose validation errors
  const errorMessage = err.errors
    ? Object.values(err.errors)
        .map((error) => error.message)
        .join(", ") // Join all validation error messages
    : err.message || "Internal Server Error"; // Fallback to a general error message if no specific error is found

  // Ensure the error has a statusCode, otherwise default to 500
  const statusCode = err.statusCode || 500;

  // Send error response in JSON format
  return res.status(statusCode).json({
    success: false,
    message: errorMessage,
  });
};

export default errorMiddleware;
