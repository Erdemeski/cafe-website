import Table from "../models/table.model.js";
import WaiterCall from "../models/waiterCall.model.js";
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

// POST /api/table/call-waiter
export const callWaiter = async (req, res) => {
  const { tableNumber, cookieNumber, expiresAt, notes } = req.body;
  
  if (!tableNumber || !cookieNumber) {
    return res.status(400).json({ message: "Eksik parametre." });
  }
  
  try {
    // Cookie validasyonu
    if (!validateCookieWithExpiry(cookieNumber, expiresAt)) {
      return res.status(401).json({ 
        success: false, 
        message: "Oturum süresi dolmuş veya geçersiz oturum bilgisi." 
      });
    }
    
    // Masa kontrolü
    const table = await Table.findOne({ tableNumber });
    if (!table) {
      return res.status(404).json({ message: "Masa bulunamadı." });
    }
    
    // Garson çağrısını veritabanına kaydet
    const waiterCall = await WaiterCall.create({
      tableNumber,
      cookieNumber,
      timestamp: new Date(),
      status: 'pending',
      notes: notes || ''
    });
    
    console.log('Garson çağrısı veritabanına kaydedildi:', waiterCall);
    
    return res.json({ 
      success: true, 
      message: "Garson çağrınız alındı. Kısa süre içinde gelecektir.",
      waiterCall
    });
  } catch (err) {
    console.error('Garson çağırma hatası:', err);
    return res.status(500).json({ message: "Garson çağrısı gönderilemedi." });
  }
};

// GET /api/table/waiter-calls - Garson çağrılarını getir
export const getWaiterCalls = async (req, res) => {
  try {
    const { status, tableNumber, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (tableNumber) filter.tableNumber = tableNumber;
    
    const waiterCalls = await WaiterCall.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await WaiterCall.countDocuments(filter);
    
    return res.json({
      success: true,
      waiterCalls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Garson çağrıları getirme hatası:', err);
    return res.status(500).json({ message: "Garson çağrıları getirilemedi." });
  }
};

// PATCH /api/table/waiter-calls/:id/status - Garson çağrısı durumunu güncelle
export const updateWaiterCallStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, attendedBy, notes } = req.body;
    
    if (!status || !['pending', 'attended', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: "Geçersiz durum." });
    }
    
    const updateData = { status };
    if (status === 'attended') {
      updateData.attendedAt = new Date();
      if (attendedBy) updateData.attendedBy = attendedBy;
    }
    if (notes !== undefined) updateData.notes = notes;
    
    const waiterCall = await WaiterCall.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!waiterCall) {
      return res.status(404).json({ message: "Garson çağrısı bulunamadı." });
    }
    
    return res.json({ success: true, waiterCall });
  } catch (err) {
    console.error('Garson çağrısı güncelleme hatası:', err);
    return res.status(500).json({ message: "Garson çağrısı güncellenemedi." });
  }
};