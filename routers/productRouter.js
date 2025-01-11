
import express from 'express';
import { createProduct, deleteProducts, getAllProducts, getShopProducts, getspecificProductsDetails, updateProduct } from '../controllers/productController.js';


const router = express.Router();

// Farmer Routes

router.post("/create-shop-product", createProduct);
router.get("/get-mystoreproducts",getShopProducts);
router.get("/getallproducts",getAllProducts);

router.delete("/delete-products/:productId",deleteProducts);
router.get("/getproductdetails/:productId",getspecificProductsDetails)
router.post("/updateproduct/:productId",updateProduct)


export default router;
