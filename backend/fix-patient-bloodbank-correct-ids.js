// Script to fix patient bloodBankId to point to correct blood banks
require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('./Models/Patient');
const BloodBank = require('./Models/BloodBank');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

async function fixPatientBloodBankIds() {
  try {
    console.log('\n🔧 Fixing Patient BloodBankId to Correct References...\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all blood banks for reference
    const bloodBanks = await BloodBank.find({});
    console.log(`📋 Available blood banks:\n`);
    bloodBanks.forEach(bb => {
      console.log(`   • ${bb.name} → ${bb._id}`);
    });
    console.log('');

    // Get all patients
    const patients = await Patient.find({});
    console.log(`📋 Processing ${patients.length} patients:\n`);

    let fixedCount = 0;

    for (const patient of patients) {
      console.log(`\n🔍 Patient: ${patient.name || patient.patientName} (MRID: ${patient.mrid})`);
      console.log(`   Current bloodBankId: ${patient.bloodBankId}`);
      console.log(`   bloodBankName (string): "${patient.bloodBankName}"`);

      if (patient.bloodBankName) {
        // Find blood bank by name
        const bloodBank = await BloodBank.findOne({
          name: { $regex: new RegExp(`^${patient.bloodBankName}$`, 'i') }
        });

        if (bloodBank) {
          console.log(`   ✅ Found blood bank: ${bloodBank.name} (ID: ${bloodBank._id})`);
          
          // Check if ID is different
          if (patient.bloodBankId?.toString() !== bloodBank._id.toString()) {
            console.log(`   🔄 Updating bloodBankId: ${patient.bloodBankId} → ${bloodBank._id}`);
            patient.bloodBankId = bloodBank._id;
            await patient.save();
            fixedCount++;
            console.log(`   ✅ Updated!`);
          } else {
            console.log(`   ℹ️  Already correct`);
          }
        } else {
          console.log(`   ❌ No blood bank found with name "${patient.bloodBankName}"`);
        }
      } else {
        console.log(`   ⚠️  No bloodBankName - skipping`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary: Fixed ${fixedCount} patient(s)\n`);

    // Verify the fix for MRID 402
    console.log('🔍 Verifying fix for MRID 402...\n');
    const patient402 = await Patient.findOne({ mrid: '402' }).populate('bloodBankId', 'name');
    
    if (patient402) {
      console.log(`✅ Patient: ${patient402.name || patient402.patientName}`);
      console.log(`   MRID: ${patient402.mrid}`);
      console.log(`   BloodBankId: ${patient402.bloodBankId?._id || patient402.bloodBankId}`);
      console.log(`   BloodBank Name (populated): ${patient402.bloodBankId?.name || 'NOT POPULATED'}`);
      console.log(`   BloodBank Name (string): ${patient402.bloodBankName}`);
      
      if (patient402.bloodBankId && patient402.bloodBankId.name) {
        console.log('\n   ✅ bloodBankId is now correctly populated!');
      } else {
        console.log('\n   ❌ bloodBankId still not working!');
      }
    }

    // Test search query
    if (patient402 && patient402.bloodBankId) {
      console.log('\n🧪 Testing search query...\n');
      const bbId = patient402.bloodBankId._id || patient402.bloodBankId;
      
      const query = {
        bloodBankId: bbId,
        mrid: { $regex: '402', $options: 'i' }
      };
      
      console.log(`   Search for: Blood Bank "${patient402.bloodBankId.name}" + MRID "402"`);
      console.log(`   Query: ${JSON.stringify({ bloodBankId: bbId.toString(), mrid: '402' })}`);
      
      const results = await Patient.find(query).populate('bloodBankId', 'name');
      console.log(`   Results: ${results.length} patient(s)`);
      
      if (results.length > 0) {
        results.forEach(p => {
          console.log(`      ✅ ${p.name || p.patientName} | MRID: ${p.mrid} | Blood Bank: ${p.bloodBankId?.name}`);
        });
        console.log('\n   🎉 SEARCH IS NOW WORKING!');
      } else {
        console.log('      ❌ No results - search still not working!');
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Fix complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  } finally {
    process.exit(0);
  }
}

fixPatientBloodBankIds();

