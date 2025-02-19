import jwt from 'jsonwebtoken';


import { Product } from '../models/productSchema.js';
import { Shop } from '../models/shopSchema.js';
import User from "../models/userSchema.js"
import { catchAsyncErrors } from '../middleware/catchAsyncErrors.js';
import ErrorHandler from '../utils/errorHandler.js';
import cloudinary from "cloudinary";
import Admin from '../models/AdminSchema.js';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export const createProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, description, price, stock, category,image } = req.body;

  // Validate inputs (except image, which will be checked separately)
  if (!name || !description || !price || !stock || !category) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  // Check for the token in the Authorization header (Bearer token)
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new ErrorHandler("No token provided, product creation not allowed", 401));
  }

  try {
    // Verify the token using JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded.id, "Decoded Token");

    // Find the shop by ID from the decoded token
    const shop = await Shop.findOne({ owner: decoded.id });
    if (!shop) {
      return next(new ErrorHandler("Shop not found or token is invalid", 401));
    }

    // Check if an image is provided
    // if (!req.files || !req.files.productImage) {
    //   return next(new ErrorHandler("Please upload a product image", 400));
    // }

    // // Upload image to Cloudinary
    // const uploadedImage = await cloudinary.uploader.upload(req.files.productImage.tempFilePath, {
    //   folder: "PRODUCT_IMAGES",
    // });

    // console.log("Cloudinary Response:", uploadedImage);

    // if (!uploadedImage || uploadedImage.error) {
    //   return next(new ErrorHandler("Error uploading image to Cloudinary", 500));
    // }

    // Create the new product with the uploaded image
    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      category,
      shop: shop._id,
      image
    });

    // Save the new product
    await newProduct.save();

    // Add this product to the shop's product list (optional)
    shop.products.push(newProduct._id);
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
  const { name, description, price, stock, category,image } = req.body;

  if (!productId) {
    return next(new ErrorHandler("Product ID is required", 400));
  }

  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return next(new ErrorHandler("No token provided, product update not allowed", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const shop = await Shop.findOne({ owner: decoded.id });

    if (!shop) {
      return next(new ErrorHandler("Shop not found or token is invalid", 401));
    }

    const product = await Product.findOne({ _id: productId, shop: shop._id });
    if (!product) {
      return next(new ErrorHandler("Product not found or doesn't belong to this shop", 404));
    }

    // Update only provided fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) {
      if (isNaN(price)) return next(new ErrorHandler("Price must be a number", 400));
      product.price = price;
    }
    if (stock) {
      if (isNaN(stock)) return next(new ErrorHandler("Stock must be a number", 400));
      product.stock = stock;
    }
    if (category) product.category = category; // Make sure category is validated if necessary

    // Update image (if provided)
    // if (req.files && req.files.productImage) {
    //   // Upload new image to Cloudinary
    //   const uploadedImage = await cloudinary.uploader.upload(req.files.productImage.tempFilePath, {
    //     folder: "PRODUCT_IMAGES",
    //   });

    //   // Check if Cloudinary upload was successful
    //   if (!uploadedImage || uploadedImage.error) {
    //     return next(new ErrorHandler("Error uploading image to Cloudinary", 500));
    //   }

      // Delete old image from Cloudinary if the new image exists
      // if (product.productImage.public_id) {
      //   await cloudinary.uploader.destroy(product.productImage.public_id);
      // }

      // Update the image details in the product
    //   product.productImage = {
    //     public_id: uploadedImage.public_id,
    //     url: uploadedImage.secure_url,
    //   };
    // }

    // Save updated product
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image:image  // Returning the updated image info
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Token expired, please login again", 401));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new ErrorHandler("Invalid token", 401));
    }
    console.error("Error in updateProduct:", error);
    return next(new ErrorHandler("Error updating product", 500));
  }
});




export const getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return next(new ErrorHandler("No token provided, unable to fetch products", 401));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user exists
    const user = await User.findById(decoded.id);
    const admin = !user ? await Admin.findById(decoded.id) : null;

    if (!user && !admin) {
      return next(new ErrorHandler("Only admin and user are allowed, token is invalid", 401));
    }

    // Fetch all products and populate the shop field
    const products = await Product.find().populate('shop');

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Token expired, please login again", 401));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new ErrorHandler("Invalid token", 401));
    }
    console.error("Error in getAllProducts:", error);
    return next(new ErrorHandler("Error fetching products", 500));
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded, "Decoded Token");

    // Find the shop by ID from the decoded token data
    const shop = await Shop.findOne({ owner: decoded.id });
    if (!shop) {
      return next(new ErrorHandler("Shop not found or token is invalid", 401));
    }

    // Find the product by ID and ensure it's linked to the shop
    const product = await Product.findOne({ _id: productId, shop: shop._id });
    if (!product) {
      return next(new ErrorHandler("Product not found or doesn't belong to this shop", 404));
    }

    // Remove the product from the shop's product list
    shop.products = shop.products.filter(
      (id) => id.toString() !== product._id.toString()
    );
    await shop.save();

    // Delete the product
    await Product.deleteOne({ _id: product._id });

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded, "Decoded Token");

    // Find the shop by ID from the decoded token data
    const shop = await Shop.findOne({ owner: decoded.id }).populate('products');
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


export const getspecificProductsDetails = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  // Check for the token in the Authorization header (Bearer token)
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer <token>

  if (!token) {
    return next(new ErrorHandler("No token provided, unable to fetch product details", 401));
  }

  try {


    if (!productId) {
      return next(new ErrorHandler("Product ID is required", 400));
    }

    // Find the product by its ID
    const product = await Product.findById(productId)
      .populate({
        path: "reviews",
        model: "Review", // Ensure Review model is referenced correctly
      })
      .populate({
        path: "shop",
        model: "Shop", // If you want to get shop details too
      });
  
      if (!product) {
        return next(new ErrorHandler("Product not found or doesn't belong to this shop", 404));
      }
  
      // Respond with the product details
      res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("Error fetching product details:", error);
  
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return next(new ErrorHandler("Invalid or expired token", 401));
      }
  
      return next(new ErrorHandler("Error fetching product details", 500));
    }
  });
  

  export const getCategoryProductCounts = catchAsyncErrors(async (req, res, next) => {
    const { category } = req.query; // Optional query param for filtering by category
  
    // Check for the token in the Authorization header (Bearer token)

    try {
      // Verify token here (if necessary)
     
      // Aggregation to get count of products by category (seed vs crop protection)
      const categoryCounts = await Product.aggregate([
        {
          $project: {
            category: { $ifNull: ["$category", "cropprotection"] }, // If category is null, set it as 'cropprotection'
          },
        },
        {
          $group: {
            _id: "$category", // Group by category
            count: { $sum: 1 }, // Sum the products per category
          },
        },
      ]);
  
      // Optionally, you can filter by category from query if passed (seed or cropprotection)
      if (category) {
        const filteredCategoryCount = await Product.countDocuments({ category });
        return res.status(200).json({
          success: true,
          filteredCategoryCount,
        });
      }
  
      // If no category is passed, return counts for both seed and crop protection
      res.status(200).json({
        success: true,
        categoryCounts, // Returns the counts of 'seed' and 'cropprotection' products
      });
    } catch (error) {
      console.error("Error fetching product category counts:", error);
  
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return next(new ErrorHandler("Invalid or expired token", 401));
      }
  
      return next(new ErrorHandler("Error fetching product category counts", 500));
    }
  });
  


  



