// Reset password for any user in database
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./Models/User');

const MONGO_URI = process.env.MONGO_URI;

// User to reset and new password
const EMAIL_TO_RESET = process.argv[2] || 'test@example.com';
const NEW_PASSWORD = process.argv[3] || 'Test123!@#';

async function resetPassword() {
  try {
    console.log('\n🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    console.log(`🔍 Looking for user: ${EMAIL_TO_RESET}`);
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: EMAIL_TO_RESET },
        { username: EMAIL_TO_RESET }
      ]
    });

    if (!user) {
      console.log(`❌ User not found: ${EMAIL_TO_RESET}`);
      console.log('\n💡 Available users:');
      
      const allUsers = await User.find({}).select('email username name role').limit(20);
      allUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email || u.username} (${u.role})`);
      });
      
      console.log('\nUsage: node reset-user-password.js <email> <new-password>');
      console.log('Example: node reset-user-password.js admin@example.com MyNewPass123!');
      
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Current password hash: ${user.password.substring(0, 20)}...`);

    // Set new password (User model pre-save hook will hash it automatically)
    console.log(`\n🔐 Setting new password: ${NEW_PASSWORD}`);
    
    // Important: Set plain text password - the User model's pre-save hook will hash it
    user.password = NEW_PASSWORD;
    await user.save();

    console.log('✅ Password updated successfully!\n');
    console.log('='.repeat(60));
    console.log('🎉 You can now login with:');
    console.log('='.repeat(60));
    console.log(`Email: ${user.email || user.username}`);
    console.log(`Password: ${NEW_PASSWORD}`);
    console.log('='.repeat(60));

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();

