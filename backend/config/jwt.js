const crypto = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production');
}

const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is unset; using a temporary development key. Set JWT_SECRET in backend/.env.');
}

module.exports = jwtSecret;