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
      console.log('User:', response.data.data.user.name, '- Role:', response.data.data.user.role);
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

async function testReceiveBloodBag() {
  try {
    console.log('\n📦 Testing blood bag reception...');
    
    const bloodBagData = {
      serialNumber: `TEST-${Date.now()}`,
      bloodGroup: 'O+',
      donorName: 'Test Donor',
      collectionDate: '2025-01-27',
      volume: 450,
      notes: 'Test blood bag for centrifuge processing'
    };

    const response = await axios.post(
      `${BASE_URL}/centrifuge-staff/blood-bags`,
      bloodBagData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ Blood bag received successfully');
      console.log('Bag ID:', response.data.data._id);
      console.log('Serial:', response.data.data.serialNumber);
      return response.data.data;
    } else {
      console.log('❌ Blood bag reception failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Blood bag reception error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testSeparateBloodBag(bloodBag) {
  try {
    console.log('\n🧪 Testing blood bag separation...');
    
    const separationData = {
      components: [
        {
          type: 'red_cells',
          volume: '200',
          serialNumber: `RC-${Date.now()}`,
          notes: 'Red blood cells component'
        },
        {
          type: 'plasma',
          volume: '200',
          serialNumber: `PL-${Date.now()}`,
          notes: 'Plasma component'
        },
        {
          type: 'platelets',
          volume: '50',
          serialNumber: `PT-${Date.now()}`,
          notes: 'Platelets component'
        }
      ],
      separationDate: '2025-01-28',
      technician: 'Test Technician',
      method: 'centrifugation',
      notes: 'Test separation process'
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
      response.data.data.components.forEach((comp, index) => {
        console.log(`  ${index + 1}. ${comp.type} - ${comp.serialNumber} (${comp.volume}ml)`);
      });
      return response.data.data;
    } else {
      console.log('❌ Blood bag separation failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Blood bag separation error:', error.response?.data?.message || error.message);
    console.log('Full error:', error.response?.data);
    return null;
  }
}

async function testGetBloodBags() {
  try {
    console.log('\n📋 Testing blood bags retrieval...');
    
    const response = await axios.get(
      `${BASE_URL}/centrifuge-staff/blood-bags`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ Blood bags retrieved successfully');
      console.log('Total bags:', response.data.data.length);
      response.data.data.forEach((bag, index) => {
        console.log(`  ${index + 1}. ${bag.serialNumber} - ${bag.bloodGroup} (${bag.status})`);
      });
      return response.data.data;
    } else {
      console.log('❌ Blood bags retrieval failed:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Blood bags retrieval error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testGetComponents() {
  try {
    console.log('\n🧪 Testing components retrieval...');
    
    const response = await axios.get(
      `${BASE_URL}/centrifuge-staff/components`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ Components retrieved successfully');
      console.log('Total components:', response.data.data.length);
      response.data.data.forEach((comp, index) => {
        console.log(`  ${index + 1}. ${comp.serialNumber} - ${comp.type} (${comp.volume}ml)`);
      });
      return response.data.data;
    } else {
      console.log('❌ Components retrieval failed:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Components retrieval error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function runTests() {
  console.log('🧪 Starting Centrifuge Staff Dashboard Tests\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Test blood bag reception
  const bloodBag = await testReceiveBloodBag();
  if (!bloodBag) {
    console.log('❌ Cannot proceed without a blood bag');
    return;
  }

  // Step 3: Test blood bag separation
  const separationResult = await testSeparateBloodBag(bloodBag);
  
  // Step 4: Test data retrieval
  await testGetBloodBags();
  await testGetComponents();

  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(console.error);