// Create Test User for Login Testing
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

const MONGO_URI = process.env.MONGO_URI;

async function createTestUser() {
  try {
    console.log('\n🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test user data
    const testUsers = [
      {
        username: 'test@example.com',
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!@#',
        role: 'user',
        provider: 'local'
      },
      {
        username: 'admin@blooddonation.com',
        name: 'Admin User',
        email: 'admin@blooddonation.com',
        password: 'Admin123!@#',
        role: 'admin',
        provider: 'local'
      },
      {
        username: 'donor@example.com',
        name: 'Donor User',
        email: 'donor@example.com',
        password: 'Donor123!@#',
        role: 'donor',
        provider: 'local'
      }
    ];

    console.log('📝 Creating test users...\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await User.findOne({ username: userData.username });
      
      if (existing) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        console.log(`   Role: ${existing.role}`);
        console.log(`   You can login with:`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: ${userData.password}\n`);
        continue;
      }

      // Create new user (password will be hashed by pre-save hook)
      const user = new User(userData);
      await user.save();

      console.log(`✅ Created user: ${userData.email}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Login with:`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}\n`);
    }

    console.log('='.repeat(60));
    console.log('\n🎉 Test users ready!');
    console.log('\n📋 You can now login with any of these accounts:');
    console.log('\n1. Regular User:');
    console.log('   Email: test@example.com');
    console.log('   Password: Test123!@#');
    console.log('\n2. Admin User:');
    console.log('   Email: admin@blooddonation.com');
    console.log('   Password: Admin123!@#');
    console.log('\n3. Donor User:');
    console.log('   Email: donor@example.com');
    console.log('   Password: Donor123!@#\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating test users:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

createTestUser();

