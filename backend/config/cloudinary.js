const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dppiuypop',
  api_key: process.env.CLOUDINARY_API_KEY || '412712715735329',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'm04IUY0-awwtr4YoS-1xvxOOIzU',
});

module.exports = cloudinary;
