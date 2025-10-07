const mongoose = require('mongoose');
const Patient = require('./Models/Patient');
const User = require('./Models/User');

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:zUuZEnV4baqSWUge@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

    // Delete existing patient with MRID 222 if exists
    const deletedPatient = await Patient.findOneAndDelete({}).where('encryptedMrid').equals('222'.toUpperCase());
    if (deletedPatient) {
      console.log('🗑️ Deleted existing patient with MRID 222');
    }

    // Check if patient with MRID 222 already exists
    const existingPatient = await Patient.findOne({}).where('encryptedMrid').equals('222'.toUpperCase());
    if (existingPatient) {
      console.log('✅ Patient with MRID 222 already exists');
      console.log('📋 Patient details:', {
        name: existingPatient.name,
        bloodGroup: existingPatient.bloodGroup,
        address: existingPatient.address
      });
      process.exit(0);
    }

    // Find an existing user or create a new one
    let user = await User.findOne({ role: 'bloodbank' });
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      // Create test user with unique username
      const timestamp = Date.now();
      user = new User({
        username: `testuser${timestamp}@example.com`,
        email: `testuser${timestamp}@example.com`,
        name: 'Test User',
        password: 'password123',
        role: 'bloodbank'
      });
      await user.save();
    }

    // Create test patient using virtual setters
    const patient = new Patient({
      bloodBankId: user._id,
      bloodGroup: 'O+',
      unitsRequired: 2,
      dateNeeded: new Date('2025-12-31')
    });

    // Use virtual setters to set encrypted fields
    patient.name = 'John Doe';
    patient.address = '123 Hospital St';
    patient.mrid = '222';
    await patient.save();

    console.log('✅ Test patient created successfully');
    console.log('📋 Patient MRID: 222, Blood Group: O+');
    console.log('🏥 Patient Name: John Doe');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();
