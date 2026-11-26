const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://adepusanjay444_db_user:abc1234@cluster0.i0fg76m.mongodb.net/';

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (connectionPromise) return connectionPromise;

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
