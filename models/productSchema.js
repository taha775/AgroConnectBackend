import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the product name"],
    },
    description: {
      type: String,
      required: [true, "Please enter the product description"],
    },
    price: {
      type: Number,
      required: [true, "Please enter the product price"],
      min: 0, // Prevent negative pricing
    },
    stock: {
      type: Number,
      required: [true, "Please enter the product stock"],
      default: 0,
      min: 0, // Prevent negative stock
    },
    image: {
      type: String,
      required: [true, "Please upload an image for the product"],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop", // Linking the product to a shop
      required: true,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review", // Linking the product to its reviews
      },
    ],
    averageRating: {
      type: Number,
      default: 0, // Holds the average rating for the product
    },
    totalReviews: {
      type: Number,
      default: 0, // Holds the total number of reviews
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
