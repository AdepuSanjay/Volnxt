const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleType: { type: String, required: true, default: 'Car' },
  brand: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  variant: { type: String },
  registrationNumber: { type: String, required: true },
  batteryCapacity: { type: Number, required: true },
  currentBatteryPercentage: { type: Number, required: true, default: 100 },
  connectorType: { type: String, required: true },
  chargingStandard: { type: String, required: true },
  supportedChargingType: { type: String, required: true },
  maxChargingPower: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
