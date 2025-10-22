const mongoose = require('mongoose');
const Patient = require('./Models/Patient');
const User = require('./Models/User');

async function createTestData() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set. Please set it to your cloud MongoDB URI.');
    }
    await mongoose.connect(process.env.MONGO_URI);

    // Delete existing patient with MRID 222 if exists
    const deletedPatient = await Patient.findOneAndDelete({ mrid: '222' });
    if (deletedPatient) {
      console.log('🗑️ Deleted existing patient with MRID 222');
    }

    // Check if patient with MRID 222 already exists
    const existingPatient = await Patient.findOne({ mrid: '222' });
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

    // Create test patient with plain text data
    const patient = new Patient({
      bloodBankId: user._id,
      bloodBankName: 'Test Blood Bank', // Add blood bank name
      name: 'John Doe',
      address: '123 Hospital St',
      bloodGroup: 'O+',
      mrid: '222',
      phoneNumber: '1234567890',
      unitsRequired: 2,
      dateNeeded: new Date('2025-12-31')
    });

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
