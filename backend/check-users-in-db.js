// Check what users exist in database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

async function checkUsers() {
  try {
    console.log('\n🔍 Checking Users in Database...\n');
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await User.find({}).select('username email name role provider');
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n💡 Run this to create test users:');
      console.log('   node create-test-user.js\n');
      process.exit(0);
    }
    
    console.log(`✅ Found ${users.length} user(s):\n`);
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Details:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Username (stored): ${user.username || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Provider: ${user.provider || 'local'}`);
      console.log('\n   ✅ Login with:');
      console.log(`      Email: ${user.email || user.username}`);
      console.log(`      Password: (the password you set during registration)`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Important Notes:');
    console.log('   • Your system uses EMAIL as username');
    console.log('   • Users MUST login with their EMAIL address');
    console.log('   • Traditional usernames (like "johndoe") are NOT supported');
    console.log('   • The "username" field in database contains EMAIL addresses\n');
    
    console.log('💡 Test Account Credentials:');
    console.log('   test@example.com / Test123!@#');
    console.log('   admin@blooddonation.com / Admin123!@#');
    console.log('   donor@example.com / Donor123!@#\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();

