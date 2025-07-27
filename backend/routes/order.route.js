import express from "express";
import { createOrder, getOrders, getOrderById, updateOrderStatus, getOrdersByTable } from "../controllers/order.controller.js";

const router = express.Router();

// POST /api/order
router.post("/give-order", createOrder);

// GET /api/order - Tüm siparişleri getir
router.get("/", getOrders);

// GET /api/order/:id - Belirli siparişi getir
router.get("/:id", getOrderById);

// GET /api/order/table/:tableNumber - Masaya ait siparişleri getir
router.get("/table/:tableNumber", getOrdersByTable);

// PATCH /api/order/:id/status - Sipariş durumunu güncelle
router.patch("/:id/status", updateOrderStatus);

export default router; 