const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ProviderProfile = require('../models/ProviderProfile');
const Vehicle = require('../models/Vehicle');
const { sendOtpEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { 
      name, email, phone, password, role, 
      vehicle, aadharNumber, profilePhoto,
      providerProfile, providerType, businessName, ownerName,
      address, latitude, longitude, chargingType, connectorType,
      chargingPower, pricingModel, price, minimumCharge,
      availableDays, startTime, endTime, safetyDeclaration
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role ? role.toUpperCase() : 'RIDER';
    const user = await User.create({ 
      name: name || ownerName || businessName || 'User', 
      email, 
      phone, 
      password: hashedPassword, 
      role: userRole, 
      aadharNumber, 
      profilePhoto 
    });

    if (user) {
      if (user.role === 'RIDER' && vehicle) {
        await Vehicle.create({
          userId: user._id,
          brand: vehicle.brand,
          vehicleModel: vehicle.vehicleModel,
          variant: vehicle.variant,
          registrationNumber: vehicle.registrationNumber,
          batteryCapacity: vehicle.batteryCapacity,
          currentBatteryPercentage: vehicle.currentBatteryPercentage,
          connectorType: vehicle.connectorType,
          chargingStandard: vehicle.chargingStandard,
          supportedChargingType: vehicle.supportedChargingType,
          maxChargingPower: vehicle.maxChargingPower
        });
      } else if (user.role === 'PROVIDER') {
        const p = providerProfile || req.body;
        await ProviderProfile.create({
          userId: user._id,
          providerType: p.providerType || 'INDIVIDUAL',
          businessName: p.businessName || p.name || user.name,
          ownerName: p.ownerName || user.name,
          phone: p.phone || user.phone,
          address: p.address || 'Address not specified',
          latitude: Number(p.latitude) || 12.9716,
          longitude: Number(p.longitude) || 77.5946,
          chargingType: p.chargingType || 'AC and DC Fast',
          connectorType: p.connectorType || 'Type 2',
          chargingPower: p.chargingPower ? String(p.chargingPower) : '50 kW',
          pricingModel: p.pricingModel || 'PER_KWH',
          price: Number(p.price) || 15,
          minimumCharge: p.minimumCharge ? Number(p.minimumCharge) : 0,
          availability: 'AVAILABLE',
          availableDays: p.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          startTime: p.startTime || '08:00 AM',
          endTime: p.endTime || '10:00 PM',
          verificationStatus: 'APPROVED',
          safetyDeclaration: p.safetyDeclaration !== undefined ? Boolean(p.safetyDeclaration) : true,
          rating: 5,
          totalRatings: 1,
          isOnline: true,
          isAvailable: true
        });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let extraData = {};
    if (user.role === 'PROVIDER') {
      extraData = await ProviderProfile.findOne({ userId: user._id });
    } else if (user.role === 'RIDER') {
      extraData = await Vehicle.findOne({ userId: user._id });
    }
    res.json({ user, extraData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No VOLNXT account found with this email address' });
    }

    // Generate 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save();

    // Send email via Gmail SMTP
    const emailResult = await sendOtpEmail(user.email, otp, user.name);

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${user.email}`,
      email: user.email,
      devOtp: emailResult.devOtp // provided for smooth local testing if SMTP not connected
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: error.message || 'Error processing forgot password request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, verification code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid 6-digit verification code' });
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password successfully updated. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: error.message || 'Error resetting password' });
  }
};

module.exports = { registerUser, authUser, getMe, forgotPassword, resetPassword };
