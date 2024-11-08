import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false }, // Indicates if the admin is verified
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);
export default Admin;
