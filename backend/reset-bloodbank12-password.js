// Reset password for bloodbank12@gmail.com

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

const EMAIL = 'bloodbank12@gmail.com';
const NEW_PASSWORD = 'BloodBank123!@#'; // Strong password

async function resetPassword() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: EMAIL },
        { username: EMAIL }
      ]
    });

    if (!user) {
      console.log(`❌ User not found: ${EMAIL}`);
      process.exit(1);
    }

    console.log(`\n📧 User found:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Name: ${user.name || 'N/A'}`);

    // Set new password (User model pre-save hook will hash it automatically)
    console.log(`\n🔐 Setting new password: ${NEW_PASSWORD}`);
    
    // Important: Set plain text password - the User model's pre-save hook will hash it
    user.password = NEW_PASSWORD;
    await user.save();

    console.log(`\n✅ Password reset successfully!`);
    console.log(`\n📋 New Login Credentials:`);
    console.log(`   Email/Username: ${EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log(`\n💡 You can now login with these credentials.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();

