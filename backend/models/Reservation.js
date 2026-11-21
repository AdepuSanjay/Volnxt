const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChargingRequest', required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED'], default: 'ACTIVE' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
