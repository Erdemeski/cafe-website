import express from "express";
import { verifyTableCode, checkTable } from "../controllers/table.controller.js";

const router = express.Router();

// POST /api/table/verify
router.post("/verify", verifyTableCode);
router.post("/check-table", checkTable);

export default router; 