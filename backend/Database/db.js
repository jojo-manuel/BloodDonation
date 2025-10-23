// Database/db.js
// MongoDB connection helper using Mongoose.

const mongoose = require('mongoose');

// Get MongoDB URI from environment variables with database name
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:zUuZEnV4baqSWUge@cluster0.iqr2jjj.mongodb.net/blooddonation?retryWrites=true&w=majority&appName=Cluster0";

// Mongoose connection options (removed deprecated options)
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

/**
 * Connect to MongoDB using Mongoose
 * Throws error if connection fails.
 */
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Add database name if not present in URI
    let connectionUri = MONGO_URI;
    if (!connectionUri.includes('mongodb.net/') || connectionUri.match(/mongodb\.net\/\?/)) {
      connectionUri = connectionUri.replace('mongodb.net/?', 'mongodb.net/blooddonation?');
      connectionUri = connectionUri.replace('mongodb.net?', 'mongodb.net/blooddonation?');
    }
    
    await mongoose.connect(connectionUri, mongooseOptions);
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    // Initialize database (remove problematic indexes)
    const initializeDatabase = require('../initDatabase');
    await initializeDatabase();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('bad auth')) {
      console.error('\n🔐 Authentication failed - Please check:');
      console.error('   1. Username and password are correct');
      console.error('   2. User exists in MongoDB Atlas Database Access');
      console.error('   3. Password special characters are URL-encoded');
      console.error('   4. User has proper database permissions\n');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('\n🌐 Network error - Please check:');
      console.error('   1. Your IP is whitelisted in MongoDB Atlas Network Access');
      console.error('   2. Internet connection is working');
      console.error('   3. Firewall is not blocking MongoDB connections\n');
    }
    
    throw error; // Re-throw to let server.js handle it
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('👋 Mongoose connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing Mongoose connection:', err);
    process.exit(1);
  }
});

module.exports = connectDB;
