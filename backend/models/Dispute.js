const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChargingSession', required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  expectedAmount: { type: Number, required: true },
  chargedAmount: { type: Number, required: true },
  status: { type: String, enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'], default: 'OPEN' }
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
