// import { User } from "../models/userSchema.js";    
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken"

export const isAuthenticated = catchAsyncErrors(async(req,res,next)=>{
    const {token} = req.cookies
    if(!token){
        return next(new ErrorHandler("User not Authenticated"),400)
    }
    const decode = jwt.verify(token,process.env.JWT_SECRET_KEY)
    req.user = await User.findById(decode.id)
    next()
})





const authorizesRoles = (...roles) => {
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

module.exports = { authorizesRoles };
