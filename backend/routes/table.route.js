import express from "express";
import { verifyTableCode, checkTable, validateTableCookie, callWaiter, getWaiterCalls, updateWaiterCallStatus } from "../controllers/table.controller.js";

const router = express.Router();

// POST /api/table/verify
router.post("/verify", verifyTableCode);
router.post("/check-table", checkTable);
router.post("/validate-cookie", validateTableCookie);
router.post("/call-waiter", callWaiter);

// GET /api/table/waiter-calls - Garson çağrılarını getir
router.get("/waiter-calls", getWaiterCalls);

// PATCH /api/table/waiter-calls/:id/status - Garson çağrısı durumunu güncelle
router.patch("/waiter-calls/:id/status", updateWaiterCallStatus);

export default router; 