const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://adepusanjay192_db_user:sanjay123@cluster0.ohkmplx.mongodb.net/';

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
