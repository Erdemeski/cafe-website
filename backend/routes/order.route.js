import express from "express";
import { createOrder } from "../controllers/order.controller.js";

const router = express.Router();

// POST /api/order
router.post("/give-order", createOrder);

export default router; 