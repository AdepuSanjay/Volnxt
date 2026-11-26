require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const ADMIN_EMAIL = 'admin@voltroute.com';
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'password123';

const ensureAdmin = async () => {
  try {
    await connectDB();

    let admin = await User.findOne({ email: /^admin@voltroute\.com$/i });
    if (!admin) {
      admin = new User({
        name: 'Admin',
        email: ADMIN_EMAIL,
        phone: '0000000000',
        role: 'ADMIN'
      });
    }

    admin.name = 'Admin';
    admin.email = ADMIN_EMAIL;
    admin.phone = admin.phone || '0000000000';
    admin.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin.role = 'ADMIN';
    admin.isActive = true;
    await admin.save();

    console.log(`Admin account ready: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error(`Admin setup failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

ensureAdmin();