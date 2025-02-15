import express from 'express';
import { getAllUsers, getUserProfile, loginAdmin, registerAdmin } from '../controllers/AdminController.js';
import { getAllShopsWithProducts, getShopById } from '../controllers/userController.js';


const router = express.Router();

// Admin Routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.get('/allusers', getAllUsers);
router.get('/user-profile/:id', getUserProfile);
router.get('/get-all-shops',getAllShopsWithProducts)
router.get('/shop-details/:id',getShopById)



export default router;
