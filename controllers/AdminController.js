
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/AdminSchema.js';
import userModel from '../models/userSchema.js';
import {errorHandler} from '../errorHandler.js';
import { catchAsyncErrors } from '../middleware/catchAsyncErrors.js';
import { Shop } from '../models/shopSchema.js';
import { orderModel } from '../models/orderSchema.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
};

// Admin Registration
export const registerAdmin = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({
            username,
            email,
            password: hashedPassword,
        });
        await admin.save();
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering admin: ' + error.message });
    }
};

// Admin Login
export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(admin._id);
        res.status(200).json({ token, admin: { id: admin._id, username: admin.username, email: admin.email } });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in admin: ' + error.message });
    }
};



export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
    console.log("Sds")
    try {
        // Fetch users where role is "user", excluding the password field
        const users = await userModel.find({ role: "user" }).select("-password");

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


export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
    try {
        console.log("first");
        const userId = req.params.id; // Get user ID from request params
        console.log(userId);

        // Find user by ID and populate shops
        const user = await userModel.findById(userId)
            .select("-password")  // Exclude password
            .populate("shops");   // Populate shops

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



export const approveShop = catchAsyncErrors(async (req, res, next) => {
    const { shopId } = req.params;
    const approved = req.body
    console.log(approved)
  
    // Get the token from the headers (assuming it is sent in the Authorization header as "Bearer <token>")
 
  
    try {
      // Verify the token
      
  
      // Find the user by decoded token ID
 
  
      // Verify if the user is an admin
    
  
      // Find the shop by ID and update the approval status
      const shop = await Shop.findByIdAndUpdate(
        shopId,
       approved,
        
      );
  
      if (!shop) {
        return next(new errorHandler("Shop not found", 404));
      }
  
      res.status(200).json({
        success: true,
        message: "Shop approved successfully",
        shop,
      });
    } catch (error) {
      return next(new errorHandler("Invalid token", 401));
    }
  });
  










// Get total users
export const getTotalUsers = catchAsyncErrors(async (req, res, next) => {
  const totalUsers = await userModel.countDocuments();

  res.status(200).json({
    success: true,
    totalUsers,
  });
});

// Get total orders
export const getTotalOrders = catchAsyncErrors(async (req, res, next) => {
  const totalOrders = await orderModel.countDocuments();

  res.status(200).json({
    success: true,
    totalOrders,
  });
});

// Get total shops
export const getTotalShops = catchAsyncErrors(async (req, res, next) => {
  const totalShops = await Shop.countDocuments();

  res.status(200).json({
    success: true,
    totalShops,
  });
});

// Get monthly orders and revenue
export const getMonthlyOrdersAndRevenue = catchAsyncErrors(async (req, res, next) => {
  const monthlyData = await orderModel.aggregate([
    {
      $group: {
        _id: { $month: '$createdAt' },    // Group by month
        totalOrders: { $sum: 1 },          // Count the total number of orders
        totalRevenue: { $sum: '$totalAmount' }, // Sum the total revenue
      },
    },
    { $sort: { _id: 1 } },   // Sort the results by month
  ]);

  // If totalRevenue is zero or undefined, we can apply a formula based on orders
  monthlyData.forEach(month => {
    if (!month.totalRevenue || month.totalRevenue === 0) {
      // Assuming each order generates $50 in revenue
      const orderRevenue = 50;
      month.totalRevenue = month.totalOrders * orderRevenue; // Assign revenue based on total orders
    }
  });

  res.status(200).json({
    success: true,
    monthlyData,
  });
});

// Get revenue summary

export const getTotalUsersAndFarmers = catchAsyncErrors(async (req, res, next) => {
  try {
    // Count total users and total farmers
    const totalUsers = await userModel.countDocuments({ role: 'user' });
    const totalFarmers = await userModel.countDocuments({ role: 'farmer' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalFarmers,
      },
    });
  } catch (error) {
    return next(new errorHandler(error.message, 500));
  }
});







