const mongoose = require('mongoose');

const chargingSessionSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChargingRequest', required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  startBatteryPercentage: { type: Number, required: true },
  targetBatteryPercentage: { type: Number, required: true },
  currentBatteryPercentage: { type: Number, required: true },
  endBatteryPercentage: { type: Number },

  pricingModel: { type: String, required: true },
  priceRate: { type: Number, required: true },

  estimatedAmount: { type: Number, required: true },
  finalAmount: { type: Number },

  platformFee: { type: Number },
  providerAmount: { type: Number },

  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },

  status: { type: String, enum: ['IN_PROGRESS', 'CHARGING', 'COMPLETED', 'DISPUTED'], default: 'CHARGING' },

  // Live telemetry metrics
  chargingPowerKw: { type: Number, default: 29.5 },
  voltageV: { type: Number, default: 382 },
  currentA: { type: Number, default: 77.2 },
  energyDeliveredKwh: { type: Number, default: 0 },

  batteryUpdates: [{
    percentage: Number,
    energyKwh: Number,
    powerKw: Number,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ChargingSession', chargingSessionSchema);
