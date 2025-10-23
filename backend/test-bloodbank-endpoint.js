// Test script to verify blood bank approved endpoint

require('dotenv').config();
const mongoose = require('mongoose');
const BloodBank = require('./Models/BloodBank');

async function testBloodBankEndpoint() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch approved blood banks (same query as endpoint)
    const bloodBanks = await BloodBank.find({ status: 'approved' });
    
    console.log('\n📊 BLOOD BANK QUERY RESULTS:');
    console.log(`Total approved blood banks: ${bloodBanks.length}`);
    
    if (bloodBanks.length === 0) {
      console.log('\n⚠️  NO APPROVED BLOOD BANKS FOUND!');
      console.log('\n💡 Checking all blood banks (any status)...');
      
      const allBloodBanks = await BloodBank.find({});
      console.log(`Total blood banks (all): ${allBloodBanks.length}`);
      
      if (allBloodBanks.length > 0) {
        console.log('\n📋 Blood Banks Found (with their status):');
        allBloodBanks.forEach((bb, index) => {
          console.log(`\n${index + 1}. Blood Bank:`);
          console.log(`   ID: ${bb._id}`);
          console.log(`   Name: ${bb.name || bb.bloodBankName || 'NO NAME'}`);
          console.log(`   Status: ${bb.status || 'NO STATUS'}`);
          console.log(`   License: ${bb.licenseNumber || 'NO LICENSE'}`);
          console.log(`   Address: ${bb.address || 'NO ADDRESS'}`);
        });
        
        console.log('\n⚠️  ISSUE: Blood banks exist but none are approved!');
        console.log('💡 SOLUTION: Update blood banks to approved status');
      } else {
        console.log('\n⚠️  NO BLOOD BANKS EXIST IN DATABASE!');
        console.log('💡 SOLUTION: Create blood banks in the database');
      }
    } else {
      console.log('\n✅ APPROVED BLOOD BANKS:');
      bloodBanks.forEach((bb, index) => {
        console.log(`\n${index + 1}. Blood Bank:`);
        console.log(`   ID: ${bb._id}`);
        console.log(`   Name: ${bb.name || bb.bloodBankName || 'NO NAME FIELD'}`);
        console.log(`   Status: ${bb.status}`);
        console.log(`   License: ${bb.licenseNumber || 'N/A'}`);
        console.log(`   Address: ${bb.address || 'N/A'}`);
        console.log(`   Phone: ${bb.phoneNumber || 'N/A'}`);
      });
      
      console.log('\n✅ DROPDOWN SHOULD SHOW:');
      bloodBanks.forEach((bb) => {
        console.log(`   • ${bb.name || bb.bloodBankName || 'Unnamed Blood Bank'}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testBloodBankEndpoint();

