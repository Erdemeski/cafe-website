import express from "express";
import { 
    getProducts, 
    getProductsPublic, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getProduct,
    getProductsByCategory
} from "../controllers/product.controller.js";
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';

const router = express.Router();

// Public routes
router.get("/public", getProductsPublic);
router.get("/get-product/:id", getProduct);
router.get("/get-products-by-category/:categoryId", getProductsByCategory);

// Protected routes (Admin only)
router.get("/get-products", verifyToken, verifyAdmin, getProducts);
router.post("/create-product", verifyToken, verifyAdmin, createProduct);
router.put("/update-product/:id", verifyToken, verifyAdmin, updateProduct);
router.delete("/delete-product/:id", verifyToken, verifyAdmin, deleteProduct);

export default router; 