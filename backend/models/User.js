const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  aadharNumber: { type: String },
  profilePhoto: { type: String },
  role: { type: String, enum: ['RIDER', 'PROVIDER', 'ADMIN'], default: 'RIDER' },
  isActive: { type: Boolean, default: true },
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
