import express from 'express';
import {
    registerFarmer,
    loginFarmer,
} from '../controllers/FarmerController.js';

const router = express.Router();

// Farmer Routes
router.post('/register', registerFarmer);
router.post('/login', loginFarmer);

export default router;
