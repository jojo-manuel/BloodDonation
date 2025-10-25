// Quick script to update a user's name in the database

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

async function updateUserName() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const email = 'jeevan@gmail.com';
    const user = await User.findOne({ username: email });

    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log('📧 Found user:', email);
    console.log('👤 Current name:', user.name || '(empty)');

    // Update the name
    const newName = 'Jeevan'; // Change this to desired name
    user.name = newName;
    await user.save();

    console.log('✅ Name updated successfully to:', newName);
    console.log('🎉 Done! Refresh your dashboard to see the change.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

updateUserName();

