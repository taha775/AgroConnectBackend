import mongoose from 'mongoose';

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
    },
    stock: {
      type: Number,
      required: [true, "Please enter the product stock"],
      default: 0,
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
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
