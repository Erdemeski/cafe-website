import Order from "../models/order.model.js";

// POST /api/order
export const createOrder = async (req, res) => {
  const { tableNumber, items } = req.body;
  if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Eksik veya hatalı sipariş verisi." });
  }
  try {
    // Mapping: name -> ProductName, price -> Price
    const mappedItems = items.map(item => ({
      id: item.id,
      ProductName: item.ProductName || item.name,
      Price: Number(item.Price || item.price),
      qty: item.qty
    }));
    const order = await Order.create({ tableNumber, items: mappedItems });
    return res.status(201).json({ success: true, order });
  } catch (err) {
    console.log('Order create error:', err);
    return res.status(500).json({ message: "Sipariş kaydedilemedi." });
  }
}; 