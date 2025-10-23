// Script to fix patient bloodBankId references based on bloodBankName
require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('./Models/Patient');
const BloodBank = require('./Models/BloodBank');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

async function fixPatientBloodBankReferences() {
  try {
    console.log('\n🔧 Fixing Patient BloodBank References...\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get ALL patients first
    const allPatients = await Patient.find({});
    console.log(`📋 Total patients in database: ${allPatients.length}\n`);
    
    // Debug: Log each patient's blood bank fields
    console.log('🔍 Checking each patient:\n');
    allPatients.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name || p.patientName} (MRID: ${p.mrid})`);
      console.log(`   bloodBankId: ${p.bloodBankId} (type: ${typeof p.bloodBankId})`);
      console.log(`   bloodBankName: "${p.bloodBankName}" (type: ${typeof p.bloodBankName}, exists: ${!!p.bloodBankName})`);
      console.log(`   Has bloodBankName field: ${p.hasOwnProperty('bloodBankName') || 'bloodBankName' in p}`);
      console.log('');
    });
    
    // Filter patients that need fixing (bloodBankId is null/undefined but bloodBankName exists)
    const patientsToFix = allPatients.filter(p => {
      const hasBBName = p.bloodBankName && p.bloodBankName !== '' && p.bloodBankName !== null && p.bloodBankName !== undefined;
      const needsBBId = !p.bloodBankId || p.bloodBankId === null;
      const needsFix = needsBBId && hasBBName;
      
      if (needsFix) {
        console.log(`   → ${p.name || p.patientName} needs fix (has name: "${p.bloodBankName}", but ID: ${p.bloodBankId})`);
      }
      return needsFix;
    });

    console.log(`📋 Found ${patientsToFix.length} patients to fix:\n`);

    let fixedCount = 0;
    let notFoundCount = 0;

    for (const patient of patientsToFix) {
      console.log(`\n🔍 Processing: ${patient.name || patient.patientName} (MRID: ${patient.mrid})`);
      console.log(`   Current bloodBankName: "${patient.bloodBankName}"`);
      console.log(`   Current bloodBankId: ${patient.bloodBankId}`);

      // Find matching blood bank by name (case-insensitive)
      const bloodBank = await BloodBank.findOne({
        name: { $regex: new RegExp(`^${patient.bloodBankName}$`, 'i') }
      });

      if (bloodBank) {
        console.log(`   ✅ Found matching blood bank: ${bloodBank.name} (ID: ${bloodBank._id})`);
        
        // Update patient with bloodBankId
        patient.bloodBankId = bloodBank._id;
        await patient.save();
        
        console.log(`   ✅ Updated patient bloodBankId!`);
        fixedCount++;
      } else {
        console.log(`   ❌ No matching blood bank found for "${patient.bloodBankName}"`);
        notFoundCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} patient(s)`);
    console.log(`   ❌ Not found: ${notFoundCount} patient(s)`);
    console.log(`   📋 Total processed: ${patientsToFix.length}`);

    // Verify the fix for MRID 402
    console.log('\n🔍 Verifying fix for MRID 402...\n');
    const patient402 = await Patient.findOne({ mrid: '402' }).populate('bloodBankId', 'name');
    
    if (patient402) {
      console.log(`✅ Patient: ${patient402.name || patient402.patientName}`);
      console.log(`   MRID: ${patient402.mrid}`);
      console.log(`   BloodBankId: ${patient402.bloodBankId?._id || patient402.bloodBankId}`);
      console.log(`   BloodBank Name (ref): ${patient402.bloodBankId?.name || 'NOT SET'}`);
      console.log(`   BloodBank Name (string): ${patient402.bloodBankName || 'NOT SET'}`);
      
      if (patient402.bloodBankId) {
        console.log('\n   ✅ bloodBankId is now properly set!');
      } else {
        console.log('\n   ❌ bloodBankId is still null!');
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
      
      console.log(`   Query: ${JSON.stringify(query)}`);
      
      const results = await Patient.find(query).populate('bloodBankId', 'name');
      console.log(`   Results: ${results.length} patient(s)`);
      
      if (results.length > 0) {
        results.forEach(p => {
          console.log(`      ✅ ${p.name || p.patientName} | MRID: ${p.mrid} | Blood Bank: ${p.bloodBankId?.name}`);
        });
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

fixPatientBloodBankReferences();

