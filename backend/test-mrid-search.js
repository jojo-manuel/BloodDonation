// Test MRID search to see what donors will be returned

require('dotenv').config();
const mongoose = require('mongoose');
const Donor = require('./Models/donor');
const Patient = require('./Models/Patient');

async function testMridSearch() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all patients
    const patients = await Patient.find().lean();
    
    if (patients.length === 0) {
      console.log('❌ No patients found! Please create a patient first.');
      return;
    }

    console.log('📋 Available Patients:\n');
    patients.forEach((p, i) => {
      console.log(`${i + 1}. MRID: ${p.mrid} | Blood Group: ${p.bloodGroup} | Name: ${p.name}`);
    });

    // Test with first patient
    const testPatient = patients[0];
    console.log(`\n\n🔍 Testing search for MRID: ${testPatient.mrid} (Blood Group: ${testPatient.bloodGroup})\n`);

    // Find donors with matching blood group
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

    const donors = await Donor.find({ bloodGroup: testPatient.bloodGroup })
      .populate('userId', 'username name email')
      .lean()
      .sort({ lastDonatedDate: 1 });

    if (donors.length === 0) {
      console.log(`❌ No donors found with blood group ${testPatient.bloodGroup}`);
      return;
    }

    console.log(`✅ Found ${donors.length} donor(s) with blood group ${testPatient.bloodGroup}:\n`);

    donors.forEach((donor, i) => {
      const isEligible = !donor.lastDonatedDate || donor.lastDonatedDate < threeMonthsAgo;
      const daysSince = donor.lastDonatedDate 
        ? Math.floor((new Date() - new Date(donor.lastDonatedDate)) / (1000 * 60 * 60 * 24))
        : null;
      
      const daysUntilEligible = isEligible ? 0 : 90 - daysSince;

      console.log(`${i + 1}. ${donor.userId?.name || donor.name || 'Unknown'}`);
      console.log(`   Blood Group: ${donor.bloodGroup}`);
      console.log(`   City: ${donor.houseAddress?.city || 'N/A'}`);
      console.log(`   Last Donated: ${donor.lastDonatedDate ? donor.lastDonatedDate.toLocaleDateString() : 'Never'}`);
      console.log(`   Status: ${isEligible ? '✅ Eligible Now' : `⏳ Wait ${daysUntilEligible} more days`}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

testMridSearch();

