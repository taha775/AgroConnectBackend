import mongoose from 'mongoose';
import bcryptjs from "bcryptjs";
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
    block: {
      type: Boolean,
      default: false,
    },
    approve: {
      type: Boolean,
      default: false,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

// Method to compare password
shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Hash the shop password before saving
shopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

export const Shop = mongoose.model("Shop", shopSchema);
