import express from 'express';
import { activateUser, createShop, hireFarmer, loginShop, LoginUser, registrationUser } from '../controllers/userController.js';


const router = express.Router();

// Farmer Routes
router.post('/register', registrationUser);
router.post('/activate-user',activateUser)
router.post('/login-user',LoginUser)
router.post("/create-shop", createShop);
router.post("/login-shop", loginShop);
router.post("/hireFarmer/:farmerId", hireFarmer);
router.get("/hireFarmer/:farmerId", hireFarmer);




export default router;
