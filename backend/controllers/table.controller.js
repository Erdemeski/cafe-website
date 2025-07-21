import Table from "../models/table.model.js";

// POST /api/table/verify
export const verifyTableCode = async (req, res) => {
  const { tableNumber, securityCode } = req.body;
  if (!tableNumber || !securityCode) {
    return res.status(400).json({ message: "Eksik parametre." });
  }
  try {
    const table = await Table.findOne({ tableNumber });
    if (!table) {
      return res.status(404).json({ message: "Masa bulunamadı." });
    }
    if (table.securityCode !== securityCode) {
      return res.status(401).json({ message: "Güvenlik kodu yanlış." });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Sunucu hatası." });
  }
}; 

export const checkTable = async (req, res) => {
  const { tableNumber } = req.body;
  if (!tableNumber) {
    return res.status(400).json({ message: "Eksik parametre." });
  }
  try {
    const table = await Table.findOne({ tableNumber });
    if (!table) {
      return res.status(404).json({ message: "Masa bulunamadı." });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};