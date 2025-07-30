import Order from "../models/order.model.js";
import { validateCookieWithExpiry } from "../utils/cookieGenerator.js";

// Order number generator
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// POST /api/order
export const createOrder = async (req, res) => {
  const { tableNumber, items, cookieNumber, totalPrice, notes, customerName, expiresAt } = req.body;
  
  // Validasyon
  if (!tableNumber || !items || !Array.isArray(items) || items.length === 0 || !cookieNumber || !totalPrice) {
    return res.status(400).json({ message: "Eksik veya hatalı sipariş verisi." });
  }
  
  // Cookie number validasyonu (format + süre kontrolü)
  if (!validateCookieWithExpiry(cookieNumber, expiresAt)) {
    return res.status(400).json({ message: "Oturum süresi dolmuş veya geçersiz oturum bilgisi." });
  }
  
  try {
    // Order number oluştur
    const orderNumber = generateOrderNumber();
    
    // Items mapping ve totalItemPrice hesaplama
    const mappedItems = items.map(item => ({
      id: item.id,
      ProductName: item.ProductName || item.name,
      Price: Number(item.Price || item.price),
      qty: item.qty,
      totalItemPrice: Number(item.Price || item.price) * item.qty
    }));
    
    // Toplam fiyat doğrulama
    const calculatedTotal = mappedItems.reduce((sum, item) => sum + item.totalItemPrice, 0);
    if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
      return res.status(400).json({ message: "Toplam fiyat hesaplaması hatalı." });
    }
    
    // Order oluştur
    const order = await Order.create({ 
      tableNumber, 
      items: mappedItems, 
      cookieNumber, 
      totalPrice: calculatedTotal,
      orderNumber,
      notes: notes || '',
      customerName: customerName || '',
      estimatedTime: 15 // Varsayılan 15 dakika
    });
    
    return res.status(201).json({ 
      success: true, 
      order,
      message: `Sipariş başarıyla alındı. Sipariş numarası: ${orderNumber}`
    });
  } catch (err) {
    console.log('Order create error:', err);
    
    // Duplicate order number hatası
    if (err.code === 11000 && err.keyPattern?.orderNumber) {
      return res.status(409).json({ message: "Sipariş numarası çakışması. Lütfen tekrar deneyin." });
    }
    
    return res.status(500).json({ message: "Sipariş kaydedilemedi." });
  }
};

// GET /api/order - Tüm siparişleri getir
export const getOrders = async (req, res) => {
  try {
    const { status, tableNumber, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (tableNumber) filter.tableNumber = tableNumber;
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Order.countDocuments(filter);
    
    return res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.log('Get orders error:', err);
    return res.status(500).json({ message: "Siparişler getirilemedi." });
  }
};

// GET /api/order/:id - Belirli siparişi getir
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı." });
    }
    
    return res.json({ success: true, order });
  } catch (err) {
    console.log('Get order by id error:', err);
    return res.status(500).json({ message: "Sipariş getirilemedi." });
  }
};

// GET /api/order/table/:tableNumber - Masaya ait siparişleri getir
export const getOrdersByTable = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const { status, limit = 20, cookieNumber } = req.query;
    
    const filter = { tableNumber };
    if (status) filter.status = status;
    if (cookieNumber) filter.cookieNumber = cookieNumber;
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    return res.json({ success: true, orders });
  } catch (err) {
    console.log('Get orders by table error:', err);
    return res.status(500).json({ message: "Siparişler getirilemedi." });
  }
};

// PATCH /api/order/:id/status - Sipariş durumunu güncelle
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedTime, notes } = req.body;
    
    if (!status || !['pending', 'preparing', 'ready', 'served', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: "Geçersiz sipariş durumu." });
    }
    
    const updateData = { status };
    if (estimatedTime) updateData.estimatedTime = estimatedTime;
    if (notes !== undefined) updateData.notes = notes;
    
    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı." });
    }
    
    return res.json({ success: true, order });
  } catch (err) {
    console.log('Update order status error:', err);
    return res.status(500).json({ message: "Sipariş durumu güncellenemedi." });
  }
}; 