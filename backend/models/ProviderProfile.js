const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerType: { type: String, enum: ['BUSINESS', 'INDIVIDUAL'], required: true },
  
  businessName: { type: String },
  ownerName: { type: String },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },

  chargingType: { type: String, required: true },
  connectorType: { type: String, required: true },
  chargingPower: { type: String, required: true },

  pricingModel: { type: String, enum: ['FIXED', 'PER_KWH', 'PER_PERCENTAGE'], required: true },
  price: { type: Number, required: true },
  minimumCharge: { type: Number },

  availability: { type: String, enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], default: 'AVAILABLE' },
  availableDays: [{ type: String }],
  startTime: { type: String },
  endTime: { type: String },

  verificationStatus: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'], default: 'APPROVED' },
  safetyDeclaration: { type: Boolean, required: true },

  rating: { type: Number, default: 5 },
  totalRatings: { type: Number, default: 1 },

  isOnline: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
