const mongoose = require('mongoose');

const chargingRequestSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batteryStart: { type: Number, required: true },
  targetBattery: { type: Number, required: true },
  estimatedPrice: { type: Number, required: true },
  estimatedTime: { type: Number, required: true },
  distance: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'ARRIVED', 'CHARGING', 'COMPLETED', 'CANCELLED', 'EXPIRED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('ChargingRequest', chargingRequestSchema);
