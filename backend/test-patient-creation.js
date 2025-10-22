const mongoose = require('mongoose');
const Patient = require('./Models/Patient');

// Test patient creation
async function testPatientCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blooddonation', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test data
    const testPatient = {
      name: 'Test Patient',
      address: {
        houseName: 'Test House',
        houseAddress: '123 Test Street',
        localBody: 'Test City',
        city: 'Test City',
        district: 'Test District',
        state: 'Test State',
        pincode: '123456'
      },
      bloodGroup: 'O+',
      mrid: 'TEST001',
      phoneNumber: '9876543210',
      unitsRequired: 2,
      dateNeeded: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      bloodBankId: new mongoose.Types.ObjectId(),
      bloodBankName: 'Test Blood Bank'
    };

    // Try to create a patient
    const patient = new Patient(testPatient);
    await patient.save();
    console.log('✅ Patient created successfully:', patient._id);

    // Clean up - delete the test patient
    await Patient.findByIdAndDelete(patient._id);
    console.log('✅ Test patient cleaned up');

    console.log('✅ Patient creation test passed!');
  } catch (error) {
    console.error('❌ Patient creation test failed:', error.message);
    if (error.code === 11000) {
      console.error('❌ Duplicate key error - this means the encryptedMrid index is still causing issues');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testPatientCreation();
