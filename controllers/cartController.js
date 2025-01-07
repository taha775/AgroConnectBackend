import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import { cartModel } from "../models/cartSchema.js";
import { Product } from '../models/productSchema.js';
import ErrorHandler from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
/**
 * Function to calculate the total price of the cart
 * @param {Object} cart - Cart object containing cart items
 */
function calcTotalPrice(cart) {
  let totalPrice = 0;
  cart.cartItem.forEach((item) => {
    totalPrice += item.quantity * item.price;
  });
  cart.totalPrice = totalPrice;
}

/**
 * Add product to cart functionality using product ID as URL param
 */
export const addProductToCart = catchAsyncErrors(async (req, res, next) => {
  const productId = req.params.id;
  const { quantity = 1 } = req.body;

  // Validate quantity
  if (quantity <= 0) {
    return next(new ErrorHandler("Invalid quantity", 400));
  }

  // Find the product and its price
  const product = await Product.findById(productId).select("price name");
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return next(new ErrorHandler("Please provide a token", 400));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token", 403));
  }

  const userId = decoded.id;
  let cart = await cartModel.findOne({ userId });

  // If cart doesn't exist, create a new one
  if (!cart) {
    cart = new cartModel({
      userId,
      cartItem: [
        {
          productId,
          name: product.name,
          price: product.price,
          quantity,
        },
      ],
    });
    calcTotalPrice(cart);
    await cart.save();
    return res.status(201).json({ message: "Product added to cart", cart });
  }

  // Check if the product already exists in the cart
  const existingItem = cart.cartItem.find((item) => item.productId == productId);

  if (existingItem) {z
    existingItem.quantity += quantity;
  } else {
    cart.cartItem.push({
      productId,
      name: product.name,
      price: product.price,
      quantity,
    });
  }

  // Recalculate total price and save
  calcTotalPrice(cart);
  if (cart.discount) {
    cart.totalPriceAfterDiscount =
      cart.totalPrice - (cart.totalPrice * cart.discount) / 100;
  }
  await cart.save();

  res.status(201).json({ message: "Product added to cart", cart });
});



//remove product
export const removeProductFromCart = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  // Validate token presence
  if (!token) {
    return next(new ErrorHandler("Please provide a token", 400));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token", 403));
  }

  const userId = decoded.id;
  const productId = req.params.id; // Get the product ID to be removed

  // Find the cart and remove the product by its productId
  let cart = await cartModel.findOneAndUpdate(
    { userId },
    { $pull: { cartItem: { productId } } }, // Match productId instead of _id
    { new: true } // Return the updated cart
  );

  // If no cart or product is found, return an error
  if (!cart) {
    return next(new ErrorHandler("Cart or product not found", 404));
  }

  // Recalculate the cart's total price and apply any discounts if applicable
  calcTotalPrice(cart);
  if (cart.discount) {
    cart.totalPriceAfterDiscount =
      cart.totalPrice - (cart.totalPrice * cart.discount) / 100;
  }

  // Save the updated cart
  await cart.save();

  res.status(200).json({ message: "Product removed from cart", cart });
});



export const getAllCartItems = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  // Validate the token
  if (!token) {
    return next(new ErrorHandler("Please provide a token", 400));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token", 403));
  }

  const userId = decoded.id;

  // Find the cart for the user
  const cart = await cartModel.findOne({ userId });

  if (!cart) {
    return next(new ErrorHandler("Cart is empty", 404));
  }

  res.status(200).json({
    message: "Cart items retrieved successfully",
    cartItems: cart.cartItem,
    totalPrice: cart.totalPrice,
    totalPriceAfterDiscount: cart.totalPriceAfterDiscount || null,
  });
});


