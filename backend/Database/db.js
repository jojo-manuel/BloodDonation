// Database/db.js
// MongoDB connection helper using Mongoose.

const mongoose = require('mongoose');

// NOTE: Consider moving credentials to an environment variable (MONGO_URI)
// and not committing secrets to source control.
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:zUuZEnV4baqSWUge@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

/**
 * Connect to MongoDB using Mongoose
 * Exits the process if connection fails.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;