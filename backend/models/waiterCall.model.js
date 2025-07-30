import mongoose from "mongoose";

const waiterCallSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true,
    index: true
  },
  cookieNumber: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'attended', 'cancelled'],
    default: 'pending',
    index: true
  },
  attendedBy: {
    type: String, // Garson adı veya ID'si
    default: null
  },
  attendedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true });

const WaiterCall = mongoose.model('WaiterCall', waiterCallSchema);

export default WaiterCall; 