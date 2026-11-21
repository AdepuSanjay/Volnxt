const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb://naveen:abc1234@ac-3egt5ty-shard-00-00.8afljyv.mongodb.net:27017,ac-3egt5ty-shard-00-01.8afljyv.mongodb.net:27017,ac-3egt5ty-shard-00-02.8afljyv.mongodb.net:27017/voltroute?ssl=true&replicaSet=atlas-12xlih-shard-0&authSource=admin&retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
