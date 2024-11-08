// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/dbConnection.js';
import farmerRoutes from "./routers/FarmersRouter.js"
import agriCustomerRoutes from "./routers/AgriCusotmerRouter.js"
import adminRoutes from "./routers/adminRouter.js"

const app = express();

// Load environment variables from .env file
dotenv.config();

// Middleware to parse JSON data
app.use(express.json());
app.use(cors()); // Enable CORS

// Connect to MongoDB
connectDB(); // Call the MongoDB connection function

// Basic route to check the server status
app.get('/', (req, res) => {
  res.send('Server is running and connected to MongoDB!');
});

// Use routers
app.use('/api/farmers', farmerRoutes); // Farmers routes
app.use('/api/customers', agriCustomerRoutes); // AgriCustomers routes
app.use('/api/admin', adminRoutes); // Admin routes

// Export the app
export default app;
