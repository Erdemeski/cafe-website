import express from "express";
import { getProducts } from "../controllers/product.controller.js";

const router = express.Router();

// GET /api/product
router.get("/get-products", getProducts);

export default router; 