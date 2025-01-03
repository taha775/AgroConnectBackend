import express from "express";
import {
  createOrder,
  updateOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
} from "../controllers/orderController.js";

const router = express.Router();

// Create a new order
router.post("/createOrder", createOrder);

// Update an order (e.g., mark as paid or delivered)
router.put("/editOrder/:orderId", updateOrder);

// Get all orders for a specific user
router.get("/getmyOrder", getUserOrders);

// Get all orders (Admin only)
router.get("/getAllOrders", getAllOrders);

// Get a single order by ID
router.get("/getOrderDetails/:orderId", getOrderById);

export default router;
