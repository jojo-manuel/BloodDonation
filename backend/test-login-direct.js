// Quick test to verify login endpoint works
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    // Connect to database
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to database');

    // Find admin user
    const user = await User.findOne({ username: 'admin@example.com' });
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('\n📋 User Found:');
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Provider:', user.provider);

    // Test password
    const testPassword = 'admin123';
    console.log('\n🔐 Testing password:', testPassword);
    
    const matches = await bcrypt.compare(testPassword, user.password);
    console.log('   Password matches:', matches ? '✅ YES' : '❌ NO');

    if (!matches) {
      console.log('\n❌ Password does not match!');
      console.log('💡 Run this to reset it:');
      console.log('   node reset-user-password.js admin@example.com admin123');
    } else {
      console.log('\n✅ Login should work!');
      console.log('\n📝 Test in browser:');
      console.log('   URL: http://localhost:5173/login');
      console.log('   Email: admin@example.com');
      console.log('   Password: admin123');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();

