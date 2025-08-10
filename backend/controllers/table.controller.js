import Table from "../models/table.model.js";
import WaiterCall from "../models/waiterCall.model.js";
import TableSession from "../models/tableSession.model.js";
import { generateCookieNumber, validateCookieWithExpiry, validateCookieNumber } from "../utils/cookieGenerator.js";
import bcrypt from "bcryptjs";

// POST /api/table/verify
export const verifyTableCode = async (req, res) => {
  const { tableNumber, securityCode, previousCookieNumber } = req.body;
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

    // Cookie number: geçerli bir önceki cookie verildiyse onu kullan, değilse yeni üret
    const cookieNumber = (typeof previousCookieNumber === 'string' && validateCookieNumber(previousCookieNumber))
      ? previousCookieNumber
      : generateCookieNumber(tableNumber);
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 dakika

    // Oturum durumunu güncelle/oluştur
    try {
      await TableSession.findOneAndUpdate(
        { tableNumber },
        {
          tableNumber,
          cookieNumber,
          lastValidatedAt: new Date(),
          expiresAt: new Date(expiresAt),
          isActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (e) {
      console.warn('TableSession upsert failed on verify:', e?.message || e);
    }

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

    // Aktif oturum durumunu güncelle
    const expDate = expiresAt ? new Date(expiresAt) : null;
    await TableSession.findOneAndUpdate(
      { tableNumber },
      {
        tableNumber,
        cookieNumber,
        lastValidatedAt: new Date(),
        expiresAt: expDate,
        isActive: expDate ? Date.now() < expDate.getTime() : true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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
  const { tableNumber, cookieNumber, expiresAt, notes, sessionId } = req.body;

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
      sessionId: sessionId || undefined,
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

// GET /api/table/get-tables - Tüm masaları getir
export const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });

    // Join session status
    const tableNumbers = tables.map((t) => t.tableNumber);
    const sessions = await TableSession.find({ tableNumber: { $in: tableNumbers } });
    const tnToSession = new Map(sessions.map((s) => [s.tableNumber, s]));

    const enriched = tables.map((t) => {
      const s = tnToSession.get(t.tableNumber);
      let sessionStatus = {
        isActive: false,
        expiresAt: null,
        lastValidatedAt: null,
      };
      if (s) {
        const expMs = s.expiresAt ? new Date(s.expiresAt).getTime() : null;
        const active = expMs ? Date.now() < expMs : !!s.isActive;
        sessionStatus = {
          isActive: active,
          expiresAt: s.expiresAt,
          lastValidatedAt: s.lastValidatedAt,
        };
      }
      const obj = t.toObject ? t.toObject() : {
        _id: t._id,
        tableNumber: t.tableNumber,
        securityCode: t.securityCode,
        hashedTableNumber: t.hashedTableNumber,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
      return { ...obj, sessionStatus };
    });

    return res.json({ success: true, tables: enriched });
  } catch (err) {
    console.error('Masalar getirme hatası:', err);
    return res.status(500).json({ message: "Masalar getirilemedi." });
  }
};

// GET /api/table/session-status - aktif oturumları getir
export const getTableSessions = async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    const tableNumbers = tables.map((t) => t.tableNumber);
    const sessions = await TableSession.find({ tableNumber: { $in: tableNumbers } });
    const tnToSession = new Map(sessions.map((s) => [s.tableNumber, s]));

    const result = tables.map((t) => {
      const s = tnToSession.get(t.tableNumber);
      let sessionStatus = { isActive: false, expiresAt: null, lastValidatedAt: null };
      if (s) {
        const expMs = s.expiresAt ? new Date(s.expiresAt).getTime() : null;
        const active = expMs ? Date.now() < expMs : !!s.isActive;
        sessionStatus = {
          isActive: active,
          expiresAt: s.expiresAt,
          lastValidatedAt: s.lastValidatedAt,
        };
      }
      return { tableNumber: t.tableNumber, sessionStatus };
    });

    return res.json({ success: true, tables: result });
  } catch (err) {
    console.error('Oturumlar getirme hatası:', err);
    return res.status(500).json({ message: "Oturumlar getirilemedi." });
  }
};

// POST /api/table/create-table - Yeni masa oluştur
export const createTable = async (req, res) => {

  try {
    const { tableNumber, securityCode } = req.body;

    if (!tableNumber || !securityCode) {
      return res.status(400).json({ message: "Masa numarası ve güvenlik kodu gerekli." });
    }

    // Check if table number already exists
    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return res.status(400).json({ message: "Bu masa numarası zaten kullanılıyor." });
    }

    const hashedTableNumber = await bcrypt.hash(tableNumber, 10);

    const newTable = new Table({
      tableNumber,
      securityCode,
      hashedTableNumber
    });

    const savedTable = await newTable.save();
    return res.status(201).json({ success: true, table: savedTable });
  } catch (err) {
    console.error('Masa oluşturma hatası:', err);
    return res.status(500).json({ message: "Masa oluşturulamadı." });
  }
};

// PUT /api/table/update-table/:id - Masa güncelle
export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber, securityCode } = req.body;

    if (!tableNumber || !securityCode) {
      return res.status(400).json({ message: "Masa numarası ve güvenlik kodu gerekli." });
    }

    // Check if table exists
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ message: "Masa bulunamadı." });
    }

    // Check if new table number conflicts with existing table
    if (tableNumber !== table.tableNumber) {
      const existingTable = await Table.findOne({ tableNumber });
      if (existingTable) {
        return res.status(400).json({ message: "Bu masa numarası zaten kullanılıyor." });
      }
    }

    const updatedTable = await Table.findByIdAndUpdate(
      id,
      { tableNumber, securityCode },
      { new: true, runValidators: true }
    );

    return res.json({ success: true, table: updatedTable });
  } catch (err) {
    console.error('Masa güncelleme hatası:', err);
    return res.status(500).json({ message: "Masa güncellenemedi." });
  }
};

// DELETE /api/table/delete-table/:id - Masa sil
export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ message: "Masa bulunamadı." });
    }

    await Table.findByIdAndDelete(id);
    return res.json({ success: true, message: "Masa başarıyla silindi." });
  } catch (err) {
    console.error('Masa silme hatası:', err);
    return res.status(500).json({ message: "Masa silinemedi." });
  }
};