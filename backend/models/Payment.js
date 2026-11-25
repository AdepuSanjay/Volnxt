const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChargingSession', required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grossAmount: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  providerAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  amountPaise: { type: Number },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String, select: false },
  status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'DISPUTED'], default: 'PENDING' }
}, { timestamps: true });

paymentSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
