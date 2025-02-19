import { orderModel } from "../models/orderSchema.js";
import { cartModel } from "../models/cartSchema.js"; // Assuming a cart model exists
import {ErrorHandler} from "../utils/errorHandler.js";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import jwt from 'jsonwebtoken';
import { Product } from "../models/productSchema.js";





export const createOrder = catchAsyncErrors(async (req, res, next) => {
  const { items, shippingAddress, paymentMethod } = req.body; // Items is an array of { productId, quantity }
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

  if (!Array.isArray(items) || items.length === 0) {
    return next(new ErrorHandler("No items provided for the order", 400));
  }

  // Validate each product and calculate the total
  const orderItems = [];
  let totalPrice = 0;

  for (const item of items) {
    const { productId, quantity } = item;

    if (!productId || quantity <= 0) {
      return next(new ErrorHandler("Invalid product or quantity", 400));
    }

    const product = await Product.findById(productId).select("price stock name");
    if (!product) {
      return next(new ErrorHandler(`Product with ID ${productId} not found`, 404));
    }

    if (quantity > product.stock) {
      return next(new ErrorHandler(`Insufficient stock for ${product.name}`, 400));
    }

    // Deduct stock
    product.stock -= quantity;
    await product.save();

    // Add to order items
    orderItems.push({
      productId,
      quantity,
      price: product.price,
      totalProductDiscount: 0, // Adjust if discounts apply
    });

    totalPrice += product.price * quantity;
  }

  // Prepare order data
  const orderData = {
    userId,
    cartItems: orderItems,
    shippingAddress,
    paymentMethod,
  };

  // Create the order
  const order = await orderModel.create(orderData);

  res.status(201).json({ message: "Order placed successfully", order });
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
  if (typeof isPaid !== "undefined") {
    order.isPaid = isPaid;
    order.paidAt = isPaid ? new Date() : null;
  }

  if (typeof isDelivered !== "undefined") {
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

  const orders = await orderModel
    .find({ userId })
    .populate("cartItems.productId", "name price");

  res.status(200).json({ message: "User orders retrieved successfully", orders });
});


// Get all orders (Admin only)
export const getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await orderModel
    .find()
    .populate("userId", "name email")
    .populate("cartItems.productId", "name price");

  res.status(200).json({ message: "All orders retrieved successfully", orders });
});


// Get single order by ID
export const getOrderById = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;

  const order = await orderModel
    .findById(orderId)
    .populate("userId", "name email")
    .populate("cartItems.productId", "name price");

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  res.status(200).json({ message: "Order retrieved successfully", order });
});
