// Show why users can't login - passwords are hashed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

async function showPasswordIssue() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('\n' + '='.repeat(70));
    console.log('🔐 WHY EXISTING USERS CANNOT LOGIN');
    console.log('='.repeat(70));
    
    const users = await User.find({}).select('username email password').limit(8);
    
    console.log('\n📊 Sample Users and Their Passwords:\n');
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. Email: ${user.email || user.username}`);
      console.log(`   Password in Database: ${user.password}`);
      console.log(`   ↑ This is HASHED (encrypted) - You can't see the original!`);
      console.log('');
    });
    
    console.log('='.repeat(70));
    console.log('\n❌ THE PROBLEM:');
    console.log('   • Passwords are stored as HASHES (encrypted)');
    console.log('   • You CANNOT see what the original password was');
    console.log('   • Users must remember their EXACT original password');
    console.log('   • If they forgot it, they CANNOT login!\n');
    
    console.log('✅ THE SOLUTION:');
    console.log('   • Reset passwords for accounts you want to use');
    console.log('   • Use the reset script I created\n');
    
    console.log('🔧 HOW TO RESET PASSWORDS:\n');
    console.log('   cd backend');
    console.log('   node reset-user-password.js <email> <new-password>\n');
    
    console.log('📝 EXAMPLE:');
    console.log('   node reset-user-password.js blood@gmail.com NewPassword123!\n');
    
    console.log('✅ ACCOUNTS ALREADY RESET (Ready to use):');
    const resetAccounts = [
      'admin@example.com → Admin123!@#',
      'jojo2001p@gmail.com → MyPassword123!',
      'bloodbank@gmail.com → BloodBank123!',
      'jeevan@gmail.com → Jeevan123!@#',
      'test@example.com → Test123!@#'
    ];
    
    resetAccounts.forEach(account => {
      console.log(`   ✓ ${account}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('\n💡 TIP: You need to reset passwords for any account you want');
    console.log('    to login with, because the original passwords are unknown.\n');
    console.log('='.repeat(70) + '\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

showPasswordIssue();

