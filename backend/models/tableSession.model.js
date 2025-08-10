import mongoose from 'mongoose';

const tableSessionSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    cookieNumber: {
      type: String,
      default: null,
      index: true,
    },
    lastValidatedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const TableSession = mongoose.model('TableSession', tableSessionSchema);

export default TableSession;


