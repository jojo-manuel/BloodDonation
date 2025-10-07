// Database/db.js
// MongoDB connection helper using Mongoose.

const mongoose = require('mongoose');

// Connection string: prefer env MONGO_URI, otherwise fall back to local MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blooddonation';

/**
 * Connect to MongoDB using Mongoose
 * Exits the process if connection fails.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;