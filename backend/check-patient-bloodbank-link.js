// Script to check patient-bloodbank relationships in database
require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('./Models/Patient');
const BloodBank = require('./Models/BloodBank');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

async function checkPatientBloodBankLinks() {
  try {
    console.log('\n🔍 Checking Patient-BloodBank Relationships...\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all blood banks
    const bloodBanks = await BloodBank.find({});
    console.log(`📋 Found ${bloodBanks.length} blood banks:\n`);
    
    bloodBanks.forEach((bb, index) => {
      console.log(`${index + 1}. ${bb.name}`);
      console.log(`   ID: ${bb._id}`);
      console.log(`   Status: ${bb.status}`);
      console.log('');
    });

    // Get all patients
    const patients = await Patient.find({}).populate('bloodBankId', 'name');
    console.log(`\n👥 Found ${patients.length} patients:\n`);
    
    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name || patient.patientName}`);
      console.log(`   MRID: ${patient.mrid}`);
      console.log(`   Blood Group: ${patient.bloodGroup}`);
      console.log(`   BloodBankId (stored): ${patient.bloodBankId}`);
      console.log(`   BloodBankId type: ${typeof patient.bloodBankId}`);
      
      if (patient.bloodBankId && patient.bloodBankId.name) {
        console.log(`   BloodBank Name (populated): ${patient.bloodBankId.name}`);
      } else {
        console.log(`   ⚠️ BloodBank NOT populated or doesn't exist!`);
      }
      
      if (patient.bloodBankName) {
        console.log(`   BloodBank Name (stored): ${patient.bloodBankName}`);
      }
      console.log('');
    });

    // Check for specific MRID 402
    console.log('\n🔍 Searching for MRID "402"...\n');
    const patient402 = await Patient.findOne({ mrid: '402' }).populate('bloodBankId', 'name address');
    
    if (patient402) {
      console.log('✅ Found patient with MRID 402:');
      console.log(`   Name: ${patient402.name || patient402.patientName}`);
      console.log(`   Blood Group: ${patient402.bloodGroup}`);
      console.log(`   BloodBankId: ${patient402.bloodBankId?._id || patient402.bloodBankId}`);
      console.log(`   BloodBank Name: ${patient402.bloodBankId?.name || patient402.bloodBankName || 'NOT SET'}`);
      console.log(`   BloodBank Address: ${patient402.bloodBankId?.address || 'NOT SET'}`);
    } else {
      console.log('❌ No patient found with MRID 402');
    }

    // Test the search query that frontend uses
    console.log('\n🧪 Testing search query with different blood banks...\n');
    
    for (const bb of bloodBanks.slice(0, 3)) { // Test first 3 blood banks
      console.log(`Testing with: ${bb.name} (ID: ${bb._id})`);
      
      const query = {
        bloodBankId: bb._id,
        mrid: { $regex: '402', $options: 'i' }
      };
      
      console.log(`   Query: ${JSON.stringify(query)}`);
      
      const results = await Patient.find(query).populate('bloodBankId', 'name');
      console.log(`   Results: ${results.length} patient(s)`);
      
      if (results.length > 0) {
        results.forEach(p => {
          console.log(`      → ${p.name || p.patientName} | MRID: ${p.mrid}`);
        });
      }
      console.log('');
    }

    await mongoose.connection.close();
    console.log('\n✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkPatientBloodBankLinks();

