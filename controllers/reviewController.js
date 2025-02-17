import { Product } from "../models/productSchema.js";
import { Review } from "../models/reviewSchema.js";
import jwt from "jsonwebtoken";


// Create a review
export const createReview = async (req, res) => {
  const { productId, text, rating } = req.body;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer <token>

  if (!token) {
    return next(new ErrorHandler("No token provided, product creation not allowed", 401));
  }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded.id, "Decoded Token");
  
  const userId = decoded.id; 

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create the review
    const review = await Review.create({
      text,
      productId,
      userId,
      rating,
    });

    // Add the review to the product's reviews array
    product.reviews.push(review._id);

    // Update average rating and total reviews
    product.averageRating =
      (product.averageRating * product.totalReviews + rating) /
      (product.totalReviews + 1);
    product.totalReviews += 1;

    await product.save();

    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// Get all reviews for a product
export const getProductReviews = async (req, res) => {
  const { productId } = req.params;

  try {
    // Find reviews for the given productId and populate the userId field with 'name' and 'email'
    const reviews = await Review.find({ productId })
      .populate('userId', 'name email') // Populating userId field with name and email
      .exec();

    if (!reviews.length) {
      return res.status(404).json({ message: "No reviews found for this product" });
    }

    // Return reviews along with the populated user data
    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};


// Delete a review
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // Decode token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the user is the review's author
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    // Delete the review
    await review.deleteOne();

    // Update product review stats
    const product = await Product.findById(review.productId);
    if (product) {
      product.reviews = product.reviews.filter(
        (id) => id.toString() !== reviewId.toString()
      );

      // Recalculate average rating and total reviews
      product.totalReviews -= 1;
      product.averageRating = product.totalReviews
        ? ((product.averageRating * (product.totalReviews + 1)) - review.rating) / product.totalReviews
        : 0;

      await product.save();
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};