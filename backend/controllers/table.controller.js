import Table from "../models/table.model.js";
import { generateCookieNumber, validateCookieWithExpiry } from "../utils/cookieGenerator.js";

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

    // Cookie number oluştur
    const cookieNumber = generateCookieNumber(tableNumber);
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 dakika

    return res.json({
      success: true,
      cookieNumber,
      expiresAt
    });
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

// POST /api/table/validate-cookie
export const validateTableCookie = async (req, res) => {
  const { tableNumber, cookieNumber, expiresAt } = req.body;
  
  console.log('Backend received data:', {
    tableNumber,
    cookieNumber,
    expiresAt,
    currentTime: Date.now(),
    timeLeft: expiresAt ? Math.floor((expiresAt - Date.now()) / 1000) : 'N/A'
  });
  
  if (!tableNumber || !cookieNumber) {
    return res.status(400).json({ message: "Eksik parametre." });
  }
  
  try {
    // Cookie validasyonu (format + süre)
    const isValidCookie = validateCookieWithExpiry(cookieNumber, expiresAt);
    
    if (!isValidCookie) {
      return res.status(401).json({ 
        success: false, 
        message: "Oturum süresi dolmuş veya geçersiz oturum bilgisi.",
        isExpired: true
      });
    }
    
    // Masa numarası kontrolü
    const table = await Table.findOne({ tableNumber });
    if (!table) {
      return res.status(404).json({ message: "Masa bulunamadı." });
    }
    
    return res.json({ 
      success: true, 
      message: "Oturum geçerli.",
      isExpired: false
    });
  } catch (err) {
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};