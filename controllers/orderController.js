import { orderModel } from "../models/orderSchema.js";
import { cartModel } from "../models/cartSchema.js"; // Assuming a cart model exists
import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import jwt from 'jsonwebtoken';



// Create a new order
export const createOrder = catchAsyncErrors(async (req, res, next) => {
  const { shippingAddress, paymentMethod } = req.body;
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

  // Fetch cart items for the user
  const cart = await cartModel.findOne({ userId });
  if (!cart || cart.cartItem.length === 0) {
    return next(new ErrorHandler("Your cart is empty", 400));
  }

  // Prepare order data
  const orderData = {
    userId,
    cartItems: cart.cartItem.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      totalProductDiscount: item.totalProductDiscount || 0,
    })),
    shippingAddress,
    paymentMethod,
  };

  // Create the order
  const order = await orderModel.create(orderData);

  // Clear the cart after creating the order
  await cartModel.findOneAndUpdate({ userId }, { cartItem: [] });

  res.status(201).json({ message: "Order created successfully", order });
});

// Update an order (e.g., mark as paid or delivered)
export const updateOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;
  const { isPaid, isDelivered } = req.body;

  const order = await orderModel.findById(orderId);
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  // Update payment and delivery status
  if (isPaid !== undefined) {
    order.isPaid = isPaid;
    order.paidAt = isPaid ? new Date() : null;
  }

  if (isDelivered !== undefined) {
    order.isDelivered = isDelivered;
    order.deliveredAt = isDelivered ? new Date() : null;
  }

  await order.save();
  res.status(200).json({ message: "Order updated successfully", order });
});

// Get all orders for a user
export const getUserOrders = catchAsyncErrors(async (req, res, next) => {
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

  const orders = await orderModel.find({ userId }).populate("cartItems.productId");
  res.status(200).json({ message: "User orders retrieved successfully", orders });
});

// Get all orders (Admin only)
export const getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await orderModel.find().populate("userId cartItems.productId");
  res.status(200).json({ message: "All orders retrieved successfully", orders });
});

// Get single order by ID
export const getOrderById = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;

  try {
    const order = await orderModel
      .findById(orderId)
      .populate("userId", "name email")
      .populate("cartItems.productId", "name price");

    if (!order) {
      console.log("No order found with the given ID.");
      return next(new ErrorHandler("Order not found", 404));
    }

    console.log("Fetched order:", JSON.stringify(order, null, 2));
    res.status(200).json({ message: "Order retrieved successfully", order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});
