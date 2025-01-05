import express from "express";
import {
  createReview,
  getProductReviews,
  deleteReview,
} from "../controllers/reviewController.js";


const reviewRouter = express.Router();

// Create a review
reviewRouter.post("/create", createReview);

// Get reviews for a specific product
reviewRouter.get("/product/:productId", getProductReviews);

// Delete a review
reviewRouter.delete("/:reviewId", deleteReview);

export default reviewRouter;
