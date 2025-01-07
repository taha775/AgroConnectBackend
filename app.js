// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/dbConnection.js';

import adminRoutes from "./routers/adminRouter.js"
import userRouter from "./routers/userRouter.js"
import productRouter from "./routers/productRouter.js"
import cartRouter  from "./routers/cartRouter.js"
import orderRouter from "./routers/orderRouter.js"
import reviewRouter from './routers/reviewRouter.js';
import farmerRouter from "./routers/farmerRouter.js"

const app = express();

// Load environment variables from .env file
dotenv.config();

// Middleware to parse JSON data
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Correct frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Connect to MongoDB
connectDB(); // Call the MongoDB connection function

// Basic route to check the server status
app.get('/', (req, res) => {
  res.send('Server is running and connected to MongoDB!');
});

// Use routers

app.use('/api/admin', adminRoutes); // Admin routes
app.use('/api/user', userRouter); // Admin routes
app.use('/api/products',productRouter); // Admin routes
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/review',reviewRouter)
app.use('/api/farmer',farmerRouter)

// Export the app
export default app;
