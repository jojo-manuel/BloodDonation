// Script to check if a user exists and test login
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');
const bcrypt = require('bcrypt');

async function checkUser() {
  try {
    console.log('\n🔍 Checking User Login...\n');
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'bloodbank12@gmail.com';
    const password = 'password123';
    
    console.log(`Looking for user with email: ${email}`);
    
    // Try different lookup methods
    let user = await User.findOne({ username: email });
    console.log(`1. Found by username: ${user ? 'YES' : 'NO'}`);
    
    if (!user) {
      user = await User.findOne({ email: email });
      console.log(`2. Found by email: ${user ? 'YES' : 'NO'}`);
    }
    
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
      console.log(`3. Found by lowercase email: ${user ? 'YES' : 'NO'}`);
    }
    
    if (!user) {
      user = await User.findOne({ username: email.toLowerCase() });
      console.log(`4. Found by lowercase username: ${user ? 'YES' : 'NO'}`);
    }
    
    if (!user) {
      // Show all bloodbank users
      console.log('\n❌ User not found!');
      console.log('\n📋 Available bloodbank users:');
      const bloodbankUsers = await User.find({ role: 'bloodbank' }).select('username email name');
      if (bloodbankUsers.length === 0) {
        console.log('   No bloodbank users found in database');
      } else {
        bloodbankUsers.forEach((u, i) => {
          console.log(`   ${i + 1}. Username: ${u.username || 'N/A'}, Email: ${u.email || 'N/A'}, Name: ${u.name || 'N/A'}`);
        });
      }
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('\n✅ User found!');
    console.log(`   ID: ${user._id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Has password: ${user.password ? 'YES' : 'NO'}`);
    
    // Test password
    if (user.password) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log(`\n🔐 Password test: ${passwordMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
      
      if (!passwordMatch) {
        console.log('\n⚠️  Password does not match!');
        console.log('   The stored password hash does not match "password123"');
        console.log('   You may need to reset the password or use the correct password');
      }
    } else {
      console.log('\n⚠️  User has no password (might be OAuth user)');
    }
    
    // Check bloodbank status
    if (user.role === 'bloodbank') {
      const BloodBank = require('./Models/BloodBank');
      const bloodBank = await BloodBank.findOne({ userId: user._id });
      if (bloodBank) {
        console.log(`\n🏥 Blood Bank Status: ${bloodBank.status || 'N/A'}`);
        console.log(`   Name: ${bloodBank.name || 'N/A'}`);
      } else {
        console.log('\n⚠️  No blood bank profile found for this user');
      }
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUser();

