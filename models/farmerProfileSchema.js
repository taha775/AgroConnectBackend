import mongoose from "mongoose";

const farmerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Link to the User model
      unique: true, // Ensure one profile per user
    },
    skills: [
      {
        category: { type: String, required: true }, // Example: "Onions", "Potatoes"
        experience: { type: Number, required: true }, // Years of experience
        description: { type: String, required: false }, // Optional description of expertise
      },
    ],
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
        }
      ]
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

const FarmerProfile = mongoose.model("FarmerProfile", farmerProfileSchema);

export default FarmerProfile;
