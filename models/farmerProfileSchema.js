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
      type: String, // URL of the profile image
      required: false,
    },
    description: {
      type: String, // Farmer's description or bio
      required: false,
    },
    pricePerDay: {
      type: Number, // Daily rate
      required: false,
    },
    pricePerMonth: {
      type: Number, // Monthly rate
      required: false,
    },
    contactDetails: {
      phone: { type: String, required: false }, // Optional phone number
      address: { type: String, required: false }, // Optional address
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
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

const FarmerProfile = mongoose.model("FarmerProfile", farmerProfileSchema);

export default FarmerProfile;
