import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true
  },
  items: [
    {
      id: mongoose.Schema.Types.Mixed, // String veya Number olabilir
      ProductName: String,
      Price: Number,
      qty: Number
    }
  ],
  status: {
    type: String,
    default: "pending"
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order; 