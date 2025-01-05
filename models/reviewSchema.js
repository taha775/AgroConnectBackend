import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      required: [true, "Review text is required"],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true, // Ensures the review is linked to a product
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Ensures the review is linked to a user
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5, // Ensures rating is between 1 and 5
    },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);
