import mongoose from 'mongoose';

const FarmersSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    farmName: { type: String, required: true },
    farmLocation: { type: String, required: true },
    isVerified: { type: Boolean, default: false }, // Indicates if the farmer is verified
    phone: { type: String, required: true },
    products: [{ type: String }], // Array of products the farmer sells
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
}, { timestamps: true });

const Farmer = mongoose.model('Farmer', FarmersSchema);
export default Farmer;
