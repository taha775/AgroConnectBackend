// error.js
export const ErrorHandler = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  };
  

  