import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true,
    unique: true
  },
  securityCode: {
    type: String,
    required: true
  },
  hashedTableNumber: {
    type: String,
    required: true
  }
}, { timestamps: true });

const Table = mongoose.model('Table', tableSchema);

export default Table; 