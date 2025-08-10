import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true,
    index: true
  },
  cookieNumber: {
    type: String,
    required: true,
    // unique: true, // Bir oturumda birden fazla siparişe izin ver
    index: true
  },
  sessionId: {
    type: String,
    required: false,
    index: true,
  },
  totalPrice: {
    type: Number,
    required: true
  },
  items: [
    {
      id: mongoose.Schema.Types.Mixed, // String veya Number olabilir
      ProductName: String,
      Price: Number,
      qty: Number,
      totalItemPrice: Number // qty * Price
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
    default: "pending"
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  estimatedTime: {
    type: Number, // dakika cinsinden
    default: 15
  },
  notes: {
    type: String,
    maxlength: 500
  },
  customerName: {
    type: String,
    maxlength: 100
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order; 