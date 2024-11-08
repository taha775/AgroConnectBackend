import express from 'express';
import { loginAgriCustomer, registerAgriCustomer } from '../controllers/AgriCustomerController.js';


const router = express.Router();

// AgriCustomer Routes
router.post('/register', registerAgriCustomer);
router.post('/login', loginAgriCustomer);

export default router;
