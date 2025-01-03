import express from "express";
import { addProductToCart,removeProductFromCart,getAllCartItems } from "../controllers/cartController.js";


const router = express.Router();

// Add product to cart
router.post("/add/:id", addProductToCart);
router.post("/remove/:id", removeProductFromCart);
router.get("/getAllCartItems",getAllCartItems)
export default router;
