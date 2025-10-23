// Test connection to "test" database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

const MONGO_URI = process.env.MONGO_URI;

async function testConnection() {
  try {
    console.log('\n🔍 Testing Connection to "test" Database\n');
    console.log('='.repeat(70));
    
    console.log('\n📋 Connection String:');
    console.log('   ' + MONGO_URI.replace(/:[^:@]+@/, ':****@'));
    
    // Extract database name
    const dbMatch = MONGO_URI.match(/mongodb\.net\/([^?]+)\?/);
    const dbName = dbMatch ? dbMatch[1] : 'unknown';
    console.log('\n🗄️  Database Name:', dbName);
    
    if (dbName !== 'test') {
      console.log('\n⚠️  WARNING: Database is NOT set to "test"!');
      console.log('   Current database:', dbName);
      console.log('   Expected database: test');
      console.log('\n💡 Fix: Update your .env file:');
      console.log('   Change: /blooddonation? to /test?');
      console.log('   Or run: cd backend && (Get-Content .env) -replace \'/blooddonation\\?\', \'/test?\' | Set-Content .env\n');
    } else {
      console.log('   ✅ Correctly set to "test" database\n');
    }
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    console.log('✅ Connected successfully!\n');
    
    // Get actual database name from connection
    const actualDb = mongoose.connection.db.databaseName;
    console.log('📊 Connected Database:', actualDb);
    
    if (actualDb !== 'test') {
      console.log('   ❌ ERROR: Connected to wrong database!');
      console.log('   Expected: test');
      console.log('   Got:', actualDb);
    } else {
      console.log('   ✅ Correctly connected to "test" database');
    }
    
    // Count users
    const userCount = await User.countDocuments();
    console.log('\n👥 Users in database:', userCount);
    
    if (userCount === 24) {
      console.log('   ✅ Correct! Found all 24 users from "test" database');
    } else if (userCount === 4) {
      console.log('   ❌ WARNING: Only 4 users found (this is "blooddonation" database)');
      console.log('   You need to switch to "test" database!');
    } else {
      console.log(`   Found ${userCount} users`);
    }
    
    // List some users
    if (userCount > 0) {
      console.log('\n📋 Sample Users:');
      const users = await User.find({}).select('email username name role').limit(5);
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email || user.username} (${user.role})`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Connection Test Complete!');
    
    if (actualDb === 'test' && userCount === 24) {
      console.log('\n🎉 SUCCESS! Everything is correctly configured!');
      console.log('   ✓ Connected to "test" database');
      console.log('   ✓ All 24 users accessible');
      console.log('\n💡 You can now login with:');
      console.log('   - jojo2001p@gmail.com / MyPassword123!');
      console.log('   - admin@example.com / Admin123!@#');
      console.log('   - bloodbank@gmail.com / BloodBank123!\n');
    } else {
      console.log('\n⚠️  ATTENTION NEEDED!');
      console.log('   Please update your .env file to use "test" database.\n');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    process.exit(1);
  }
}

testConnection();

