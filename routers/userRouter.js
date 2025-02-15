import express from 'express';
import { activateUser, createShop, hireFarmer, loginShop, LoginUser, registrationUser,getHiredFarmers, updateProfile, getAllUsers, getUserProfile } from '../controllers/userController.js';
import { uploadShopImage } from '../controllers/shopController.js';



const router = express.Router();

// Farmer Routes
router.post('/register', registrationUser);
router.post('/activate-user',activateUser)
router.post('/login-user',LoginUser)
router.post("/create-shop", createShop);
router.post("/login-shop", loginShop);
router.post("/hireFarmer/:farmerId", hireFarmer);
router.get("/gethiredfarmers", getHiredFarmers);
router.put("/profileupdate", updateProfile);
router.get("/getllusers", getAllUsers);
router.get("/userprofile/:id", getUserProfile);
router.put("/uploadshopimg/:shop_id", uploadShopImage);




export default router;
