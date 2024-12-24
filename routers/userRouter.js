import express from 'express';
import { activateUser, createShop, loginShop, LoginUser, registrationUser } from '../controllers/userController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { createProduct, deleteProducts, getShopProducts } from '../controllers/productController.js';

const router = express.Router();

// Farmer Routes
router.post('/register', registrationUser);
router.post('/activate-user',activateUser)
router.post('/login-user',LoginUser)
router.post("/create-shop", createShop);
router.post("/login-shop", loginShop);
router.post("/create-shop-product", createProduct);
router.get("/get-mystoreproducts",getShopProducts);
router.delete("/delete-products",deleteProducts);


export default router;
