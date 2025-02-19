import mongoose from 'mongoose';
import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Regular expression for email validation
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// User schema definition
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      match: [emailRegexPattern, "Please enter a valid email"],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't return the password field by default
    },
    profileImage: {
      public_id: {
        type: String,
        required: false,
      },
      url: {
        type: String,
        required: false,
      },
    },
    role: {
      type: String,
      enum: ["farmer", "user"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    shops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
      }
    ],
    hiredFarmers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FarmerProfile", // Reference the Farmer Profile schema
      }
    ],
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Password comparison method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Sign access token (updated for 10 days expiration)
userSchema.methods.SignAccessToken = function () {
  const accessTokenExpire = process.env.ACCESS_TOKEN_EXPIRES || "864000"; // 10 days
  return jwt.sign(
    { id: this._id, role: this.role }, // Include role in token payload
    process.env.JWT_SECRET || "",
    { expiresIn: `${accessTokenExpire}s` }
  );
};

// Sign refresh token
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
    expiresIn: "3d",
  });
};

// Middleware to hash the password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

// Create and export the User model
const userModel = mongoose.model("User", userSchema);

export default userModel;
