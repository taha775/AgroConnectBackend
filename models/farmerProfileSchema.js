import mongoose from "mongoose";

const farmerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Link to the User model
      unique: true, // Ensure one profile per user
    },
    profileImage: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    description: {
      type: String, // Farmer's description or bio
      required: true,
    },
    pricePerDay: {
      type: Number, // Daily rate
      required: true,
    },
    pricePerMonth: {
      type: Number, // Monthly rate
      required: true,
    },
    contactDetails: {
      phone: { type: String, required: true }, // Optional phone number
      address: { type: String, required: true }, // Optional address
    },
    availability: {
      type: Boolean,
      default: true, // Indicates whether the farmer is available for hire
    },
    hiredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Users who hired the farmer
      },
    ],
    completeProfile: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

const FarmerProfile = mongoose.model("FarmerProfile", farmerProfileSchema);

export default FarmerProfile;
