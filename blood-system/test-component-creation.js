const axios = require('axios');

const BASE_URL = 'http://localhost:5004/api';

// Test credentials for centrifuge staff
const testCredentials = {
  email: 'centrifufivc',
  password: 'gga3s7xp'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in as centrifuge staff...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
    
    if (response.data.success) {
      authToken = response.data.data.accessToken;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSimpleSeparation() {
  try {
    console.log('\n🧪 Testing simple blood bag separation...');
    
    // First, get an existing blood bag
    const bagsResponse = await axios.get(
      `${BASE_URL}/centrifuge-staff/blood-bags`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (!bagsResponse.data.success || bagsResponse.data.data.length === 0) {
      console.log('❌ No blood bags available for testing');
      return;
    }

    const bloodBag = bagsResponse.data.data.find(bag => bag.status === 'received');
    if (!bloodBag) {
      console.log('❌ No received blood bags available for separation');
      return;
    }

    console.log('Using blood bag:', bloodBag.serialNumber);

    // Try separation with minimal data
    const separationData = {
      components: [
        {
          type: 'red_cells',
          volume: '100',
          serialNumber: `SIMPLE-RC-${Date.now()}`,
          notes: 'Simple test component'
        }
      ],
      separationDate: '2025-01-28',
      technician: 'Test Technician',
      method: 'centrifugation',
      notes: 'Simple test separation'
    };

    console.log('Separation data:', JSON.stringify(separationData, null, 2));

    const response = await axios.post(
      `${BASE_URL}/centrifuge-staff/blood-bags/${bloodBag._id}/separate`,
      separationData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ Blood bag separated successfully');
      console.log('Components created:', response.data.data.components.length);
      return response.data.data;
    } else {
      console.log('❌ Blood bag separation failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Blood bag separation error:', error.response?.data?.message || error.message);
    console.log('Full error response:', error.response?.data);
    if (error.response?.status === 500) {
      console.log('This is a server error. Check the backend logs for more details.');
    }
    return null;
  }
}

async function runTest() {
  console.log('🧪 Starting Simple Component Creation Test\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Test simple separation
  await testSimpleSeparation();

  console.log('\n🎉 Test completed!');
}

// Run the test
runTest().catch(console.error);