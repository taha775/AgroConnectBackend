import jwt from 'jsonwebtoken';



import { Product } from '../models/productSchema.js';
import { Shop } from '../models/shopSchema.js';
import { catchAsyncErrors } from '../middleware/catchAsyncErrors.js';
import ErrorHandler from '../utils/errorHandler.js';

export const createProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, description, price, stock, image } = req.body;

  // Validate inputs
  if (!name || !description || !price || !stock || !image) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  // Check for the token in the Authorization header (Bearer token)
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer <token>

  if (!token) {
    return next(new ErrorHandler("No token provided, product creation not allowed", 401));
  }

  try {
    // Verify the token using the shop's secret
    const decoded = jwt.verify(token, process.env.JWT_SHOP_SECRET);
    console.log(decoded, "Decoded Token");

    // Find the shop by ID from the decoded token data
    const shop = await Shop.findById(decoded.id);
    if (!shop) {
      return next(new ErrorHandler("Shop not found or token is invalid", 401));
    }

    // Create the new product and link it to the shop
    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      image,
      shop: shop._id,  // Linking product to the shop
    });

    // Save the new product
    await newProduct.save();

    // Add this product to the shop's product list (optional)
    shop.products.push(newProduct._id); // Adding the product to the shop's products array
    await shop.save();

    // Respond with success message
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: newProduct,
    });

  } catch (error) {
    console.error("Error in createProduct:", error);
    return next(new ErrorHandler("Invalid token or token expired", 401));
  }
});



export const updateProduct = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const { name, description, price, stock, image } = req.body;
  
    // Validate inputs
    if (!name || !description || !price || !stock || !image) {
      return next(new ErrorHandler("Please provide all required fields", 400));
    }
  
    // Check for the token in the Authorization header (Bearer token)
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer <token>
  
    if (!token) {
      return next(new ErrorHandler("No token provided, product update not allowed", 401));
    }
  
    try {
      // Verify the token using the shop's secret
      const decoded = jwt.verify(token, process.env.JWT_SHOP_SECRET);
      console.log(decoded, "Decoded Token");
  
      // Find the shop by ID from the decoded token data
      const shop = await Shop.findById(decoded.id);
      if (!shop) {
        return next(new ErrorHandler("Shop not found or token is invalid", 401));
      }
  
      // Find the product by ID and ensure it's linked to the shop
      const product = await Product.findOne({ _id: productId, shop: shop._id });
      if (!product) {
        return next(new ErrorHandler("Product not found or doesn't belong to this shop", 404));
      }
  
      // Update the product details
      product.name = name;
      product.description = description;
      product.price = price;
      product.stock = stock;
      product.image = image;
  
      // Save the updated product
      await product.save();
  
      // Respond with success message
      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
      });
  
    } catch (error) {
      console.error("Error in updateProduct:", error);
      return next(new ErrorHandler("Invalid token or token expired", 401));
    }
  });

  






  



  export const deleteProducts = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
  
    // Check for the token in the Authorization header (Bearer token)
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer <token>
  
    if (!token) {
      return next(new ErrorHandler("No token provided, product deletion not allowed", 401));
    }
  
    try {
      // Verify the token using the shop's secret
      const decoded = jwt.verify(token, process.env.JWT_SHOP_SECRET);
      console.log(decoded, "Decoded Token");
  
      // Find the shop by ID from the decoded token data
      const shop = await Shop.findById(decoded.id);
      if (!shop) {
        return next(new ErrorHandler("Shop not found or token is invalid", 401));
      }
  
      // Find the product by ID and ensure it's linked to the shop
      const product = await Product.findOne({ _id: productId, shop: shop._id });
      if (!product) {
        return next(new ErrorHandler("Product not found or doesn't belong to this shop", 404));
      }
  
      // Remove the product from the shop's product list
      shop.products = shop.products.filter(productId => productId.toString() !== product._id.toString());
      await shop.save();
  
      // Delete the product
      await product.remove();
  
      // Respond with success message
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
  
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      return next(new ErrorHandler("Invalid token or token expired", 401));
    }
  });

   export const getShopProducts = catchAsyncErrors(async (req, res, next) => {
    // Check for the token in the Authorization header (Bearer token)
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer <token>
  
    if (!token) {
      return next(new ErrorHandler("No token provided, unable to fetch products", 401));
    }
  
    try {
      // Verify the token using the shop's secret
      const decoded = jwt.verify(token, process.env.JWT_SHOP_SECRET);
      console.log(decoded, "Decoded Token");
  
      // Find the shop by ID from the decoded token data
      const shop = await Shop.findById(decoded.id).populate('products');
      if (!shop) {
        return next(new ErrorHandler("Shop not found or token is invalid", 401));
      }
  
      // Respond with the shop's products
      res.status(200).json({
        success: true,
        products: shop.products,
      });
  
    } catch (error) {
      console.error("Error in getShopProducts:", error);
      return next(new ErrorHandler("Invalid token or token expired", 401));
    }
  });

  



