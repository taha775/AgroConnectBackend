
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/AdminSchema.js';
import userModel from '../models/userSchema.js';
import ErrorHandler from '../utils/errorHandler.js';
import { catchAsyncErrors } from '../middleware/catchAsyncErrors.js';

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
            return next(new ErrorHandler("No users found", 404));
        }

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
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
            return next(new ErrorHandler("User not found", 404));
        }

        res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});
