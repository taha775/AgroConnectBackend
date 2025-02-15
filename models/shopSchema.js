import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();
// Shop Schema
const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the shop name"],
    },
    shop_code: {
      type: String,
      unique: true,
      required: [true, "Shop code is required"],
    },
    password: {
      type: String,
      required: [true, "Please set a password for the shop"],
      select: false,
    },
    shop_img: {
      public_id: {
        type: String,
        required: false,
      },
      url: {
        type: String,
        required: false,
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",  // Reference to Product schema
      },
    ],
  },
  { timestamps: true }
);

// Method to compare password
shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash the shop password before saving
shopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export const Shop = mongoose.model("Shop", shopSchema);
