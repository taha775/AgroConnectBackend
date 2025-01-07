import express from "express";
import {
  createOrUpdateFarmerProfile,
  getAllFarmerProfiles,
  getFarmerProfileById,
  hireFarmer,
} from "../controllers/FarmerProfileController.js";


const router = express.Router();

// Create or update a farmer's profile
router.post("/createOrUpdateProfile", createOrUpdateFarmerProfile);

// Get all farmer profiles
router.get("/getAllProfiles", getAllFarmerProfiles);

// Get a specific farmer profile by ID
router.get("/getProfile/:farmerId", getFarmerProfileById);

// Hire a farmer
router.post("/hireFarmer/:farmerId", hireFarmer);

export default router;
