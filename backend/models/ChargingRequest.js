const mongoose = require('mongoose');

const chargingRequestSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batteryStart: { type: Number, required: true },
  targetBattery: { type: Number, required: true },
  estimatedPrice: { type: Number, required: true },
  estimatedTime: { type: Number, required: true },
  distance: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'CHARGING', 'COMPLETED', 'CANCELLED', 'EXPIRED'], 
    default: 'PENDING' 
  },
  // Real-time tracking fields for biker / mobile charger
  bikerName: { type: String, default: 'Ramesh K. (Certified EV Tech)' },
  bikerPhone: { type: String, default: '+91 98450 12345' },
  bikerVehicle: { type: String, default: 'VOLNXT Mobile DC Van (KA-01-EV-4421)' },
  currentDistanceKm: { type: Number },
  etaMinutes: { type: Number },
  currentLat: { type: Number },
  currentLng: { type: Number },
  riderLat: { type: Number },
  riderLng: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('ChargingRequest', chargingRequestSchema);
