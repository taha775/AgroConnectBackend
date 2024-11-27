import express from 'express';
import { activateUser, LoginUser, registrationUser } from '../controllers/userController.js';

const router = express.Router();

// Farmer Routes
router.post('/register', registrationUser);
router.post('/activate-user',activateUser)
router.post('/login-user',LoginUser)


export default router;
