import express from 'express';
import { approveShop, getAllUsers, getMonthlyOrdersAndRevenue, getTotalOrders, getTotalShops, getTotalUsers, getTotalUsersAndFarmers, getUserProfile, loginAdmin, registerAdmin } from '../controllers/AdminController.js';
import { getAllShopsWithProducts, getShopById } from '../controllers/userController.js';
import { getAllOrders } from '../controllers/orderController.js';
import { getCategoryProductCounts } from '../controllers/productController.js';


const router = express.Router();

// Admin Routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.get('/allusers', getAllUsers);
router.get('/user-profile/:id', getUserProfile);
router.get('/get-all-shops',getAllShopsWithProducts)
router.get('/shop-details/:id',getShopById)
router.get('/get-all-orders',getAllOrders)
router.put("/approve/:shopId",approveShop);
router.get('/total-users', getTotalUsers);
router.get('/total-orders', getTotalOrders);
router.get('/total-shops', getTotalShops);
router.get('/monthly-orders-revenue', getMonthlyOrdersAndRevenue);
router.get('/product-category-count', getCategoryProductCounts);

router.get('/total-user-and-farmers', getTotalUsersAndFarmers);



export default router;
