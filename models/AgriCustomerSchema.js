import mongoose from 'mongoose';

const agriCustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false }, // Indicates if the customer is verified
    phone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    favoriteProducts: [{ type: String }], // Array of favorite products
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
}, { timestamps: true });

const AgriCustomer = mongoose.model('AgriCustomer', agriCustomerSchema);
export default AgriCustomer;
