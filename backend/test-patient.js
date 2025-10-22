const axios = require('axios');

async function testPatientCreation() {
  try {
    console.log('🧪 Testing patient creation...');
    
    // Test data
    const testPatient = {
      patientName: 'Test Patient',
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
      mrid: 'TEST' + Date.now(), // Unique MRID
      phoneNumber: '9876543210',
      requiredUnits: 2,
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      bloodBankId: '507f1f77bcf86cd799439011', // Sample ObjectId
      bloodBankName: 'Test Blood Bank'
    };

    // Make the request
    const response = await axios.post('http://localhost:5000/api/patients', testPatient, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth, but we can see the error
      }
    });

    console.log('✅ Patient creation successful:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('📋 Response status:', error.response.status);
      console.log('📋 Response data:', error.response.data);
      
      if (error.response.data.message && error.response.data.message.includes('encryptedMrid')) {
        console.log('❌ Still getting encryptedMrid error');
      } else if (error.response.status === 401 || error.response.status === 403) {
        console.log('✅ No encryptedMrid error - authentication error is expected');
      } else {
        console.log('✅ No encryptedMrid error - different error:', error.response.data.message);
      }
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

testPatientCreation();
