import express from "express";
import { verifyTableCode, checkTable, validateTableCookie, callWaiter, getWaiterCalls, updateWaiterCallStatus, getTables, createTable, updateTable, deleteTable, getTableSessions } from "../controllers/table.controller.js";
import { verifyToken, verifyAdmin, verifyStaff } from '../utils/verifyUser.js';

const router = express.Router();

// Public routes
router.post("/verify", verifyTableCode);
router.post("/check-table", checkTable);
router.post("/validate-cookie", validateTableCookie);
router.post("/call-waiter", callWaiter);

// GET /api/table/waiter-calls - Garson çağrılarını getir
router.get("/waiter-calls", getWaiterCalls);

// PATCH /api/table/waiter-calls/:id/status - Garson çağrısı durumunu güncelle
router.patch("/waiter-calls/:id/status", updateWaiterCallStatus);

// Protected routes (Staff can read tables/session status)
router.get("/get-tables", verifyToken, verifyStaff, getTables);
router.get("/session-status", verifyToken, verifyStaff, getTableSessions);
router.post("/create-table", verifyToken, verifyAdmin, createTable);
router.put("/update-table/:id", verifyToken, verifyAdmin, updateTable);
router.delete("/delete-table/:id", verifyToken, verifyAdmin, deleteTable);

export default router; 