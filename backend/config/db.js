require('dotenv').config();

const mongoose = require('mongoose');

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (connectionPromise) return connectionPromise;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured');
  }

  connectionPromise = mongoose.connect(mongoUri)
    .then((conn) => {
      console.log('MongoDB Connected');
      return conn;
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  try {
    return await connectionPromise;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`, { cause: error });
  }
};

module.exports = connectDB;
