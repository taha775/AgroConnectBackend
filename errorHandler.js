class errorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Captures the stack trace and ensures it is cleaned up
    Error.captureStackTrace(this, this.constructor);
  }
}

export  {errorHandler};
