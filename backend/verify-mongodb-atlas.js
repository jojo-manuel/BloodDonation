/**
 * MongoDB Atlas Credential Verifier
 * This script helps diagnose MongoDB Atlas connection issues
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

console.log('\n' + '='.repeat(60));
console.log('🔍 MONGODB ATLAS CREDENTIAL VERIFIER');
console.log('='.repeat(60) + '\n');

// Parse the connection string
try {
  const url = new URL(MONGO_URI.replace('mongodb+srv://', 'https://'));
  const username = url.username;
  const password = url.password;
  const host = url.hostname;
  const database = url.pathname.substring(1).split('?')[0];
  
  console.log('📋 CONNECTION STRING ANALYSIS:');
  console.log('   ✓ Protocol: mongodb+srv://');
  console.log(`   ✓ Username: ${username}`);
  console.log(`   ✓ Password: ${password.substring(0, 4)}${'*'.repeat(password.length - 4)}`);
  console.log(`   ✓ Host: ${host}`);
  console.log(`   ✓ Database: ${database || '(NOT SPECIFIED - THIS IS REQUIRED!)'}`);
  
  if (!database) {
    console.log('\n⚠️  WARNING: No database name specified in connection string!');
    console.log('   Your URI should look like:');
    console.log(`   mongodb+srv://${username}:${password}@${host}/DATABASE_NAME?...`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🔐 CREDENTIAL VALIDATION CHECKS:');
  console.log('='.repeat(60) + '\n');
  
  // Check 1: Username format
  console.log('1. Username Format Check:');
  if (username && username.length > 0) {
    console.log(`   ✓ Username exists: "${username}"`);
  } else {
    console.log('   ❌ Username is missing or empty!');
  }
  
  // Check 2: Password format
  console.log('\n2. Password Format Check:');
  if (password && password.length > 0) {
    console.log(`   ✓ Password exists (length: ${password.length})`);
    
    // Check for special characters that might need encoding
    const specialChars = ['@', ':', '/', '?', '#', '[', ']', '%', '&', '='];
    const foundSpecialChars = specialChars.filter(char => password.includes(char));
    
    if (foundSpecialChars.length > 0) {
      console.log(`   ⚠️  Password contains special characters: ${foundSpecialChars.join(', ')}`);
      console.log('   These should be URL-encoded in connection string!');
      console.log('   Encoding guide:');
      foundSpecialChars.forEach(char => {
        const encoded = encodeURIComponent(char);
        console.log(`      ${char} → ${encoded}`);
      });
    } else {
      console.log('   ✓ Password has no special characters requiring encoding');
    }
  } else {
    console.log('   ❌ Password is missing or empty!');
  }
  
  // Check 3: Host format
  console.log('\n3. Cluster Host Check:');
  if (host.includes('.mongodb.net')) {
    console.log(`   ✓ Valid MongoDB Atlas host: ${host}`);
  } else {
    console.log(`   ⚠️  Host doesn't look like a MongoDB Atlas cluster: ${host}`);
  }
  
} catch (error) {
  console.log('❌ Error parsing connection string:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🌐 ATTEMPTING CONNECTION...');
console.log('='.repeat(60) + '\n');

async function testConnection() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...\n');
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅✅✅ SUCCESS! CONNECTION ESTABLISHED ✅✅✅\n');
    console.log('Connection Details:');
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   Read State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    await mongoose.connection.close();
    console.log('\n✓ Connection closed successfully');
    process.exit(0);
    
  } catch (error) {
    console.log('❌❌❌ CONNECTION FAILED ❌❌❌\n');
    console.log(`Error Type: ${error.name}`);
    console.log(`Error Message: ${error.message}\n`);
    
    console.log('='.repeat(60));
    console.log('🔧 TROUBLESHOOTING GUIDE:');
    console.log('='.repeat(60) + '\n');
    
    if (error.message.includes('bad auth')) {
      console.log('❌ AUTHENTICATION ERROR DETECTED\n');
      console.log('This means MongoDB Atlas rejected your username/password.\n');
      console.log('REQUIRED ACTIONS:');
      console.log('─'.repeat(60));
      console.log('\n1️⃣  GO TO MONGODB ATLAS:');
      console.log('   🔗 https://cloud.mongodb.com/\n');
      
      console.log('2️⃣  CHECK DATABASE ACCESS:');
      console.log('   • Click "Database Access" in left sidebar');
      console.log('   • Look for user: "jojomanuelp2026"');
      console.log('   • If user DOESN\'T exist → CREATE NEW USER');
      console.log('   • If user EXISTS → RESET PASSWORD\n');
      
      console.log('3️⃣  CREATE/RESET USER STEPS:');
      console.log('   a) Click "Add New Database User" (or "Edit" for existing)');
      console.log('   b) Authentication: Password');
      console.log('   c) Username: jojomanuelp2026 (or your choice)');
      console.log('   d) Password: Click "Autogenerate Secure Password"');
      console.log('   e) 📋 COPY THE PASSWORD IMMEDIATELY!');
      console.log('   f) Built-in Role: "Atlas admin" or "Read and write to any database"');
      console.log('   g) Click "Add User" or "Update User"\n');
      
      console.log('4️⃣  UPDATE YOUR .ENV FILE:');
      console.log('   • Open: backend\\.env');
      console.log('   • Update MONGO_URI with new password');
      console.log('   • Save the file\n');
      
      console.log('5️⃣  RUN THIS SCRIPT AGAIN:');
      console.log('   node verify-mongodb-atlas.js\n');
      
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.log('❌ NETWORK ERROR DETECTED\n');
      console.log('REQUIRED ACTIONS:');
      console.log('─'.repeat(60));
      console.log('\n1️⃣  CHECK NETWORK ACCESS IN MONGODB ATLAS:');
      console.log('   • Go to: https://cloud.mongodb.com/');
      console.log('   • Click "Network Access" in left sidebar');
      console.log('   • Click "Add IP Address"');
      console.log('   • For testing: Click "Allow Access from Anywhere" (0.0.0.0/0)');
      console.log('   • Click "Confirm"\n');
      
      console.log('2️⃣  CHECK YOUR INTERNET CONNECTION\n');
      console.log('3️⃣  CHECK FIREWALL SETTINGS\n');
    }
    
    console.log('='.repeat(60));
    console.log('\n💡 STILL HAVING ISSUES?');
    console.log('   The credentials in your connection string do not match');
    console.log('   what MongoDB Atlas has on record. You MUST reset the');
    console.log('   password in MongoDB Atlas and update your .env file.\n');
    console.log('='.repeat(60) + '\n');
    
    process.exit(1);
  }
}

testConnection();

