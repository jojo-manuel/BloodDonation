// Script to reset password for bloodbank12@gmail.com
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

async function resetPassword() {
  try {
    console.log('\n🔧 Resetting Password...\n');
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'bloodbank12@gmail.com';
    const newPassword = 'password123';
    
    // Find user
    let user = await User.findOne({ username: email });
    
    if (!user) {
      user = await User.findOne({ email: email });
    }
    
    if (!user) {
      console.log(`❌ User ${email} not found!`);
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.username || user.email}`);
    console.log(`   Role: ${user.role}`);
    
    // Reset password (the model will hash it automatically)
    user.password = newPassword;
    await user.save();
    
    console.log(`\n✅ Password reset successfully!`);
    console.log(`   New password: ${newPassword}`);
    console.log(`\n💡 You can now login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();

