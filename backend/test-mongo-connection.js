// Test MongoDB Connection
// Run this to test your MongoDB Atlas connection independently

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

console.log('\n🔍 Testing MongoDB Connection...');
console.log('📍 URI:', MONGO_URI ? MONGO_URI.replace(/:[^:@]+@/, ':****@') : 'NOT FOUND');

async function testConnection() {
  try {
    console.log('\n⏳ Connecting to MongoDB...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    
    console.log('✅ SUCCESS! Connected to MongoDB Atlas');
    console.log('📊 Connection State:', mongoose.connection.readyState);
    console.log('🗄️  Database Name:', mongoose.connection.db.databaseName);
    
    await mongoose.connection.close();
    console.log('\n✅ Connection closed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.error('\n🔐 AUTHENTICATION ERROR:');
      console.error('   1. Username or password is incorrect');
      console.error('   2. User may not exist in MongoDB Atlas');
      console.error('   3. User may not have proper permissions');
      console.error('\n📋 TO FIX:');
      console.error('   → Go to: https://cloud.mongodb.com/');
      console.error('   → Navigate to: Database Access');
      console.error('   → Verify user exists or create new user');
      console.error('   → Reset password and update .env file');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('\n🌐 NETWORK ERROR:');
      console.error('   1. Check your internet connection');
      console.error('   2. Your IP may not be whitelisted');
      console.error('\n📋 TO FIX:');
      console.error('   → Go to: https://cloud.mongodb.com/');
      console.error('   → Navigate to: Network Access');
      console.error('   → Add your IP or use 0.0.0.0/0 for testing');
    }
    
    process.exit(1);
  }
}

testConnection();

