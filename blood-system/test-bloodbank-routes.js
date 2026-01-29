const axios = require('axios');

const BASE_URL = 'http://localhost:5004/api';

// Test credentials for bloodbank manager
const testCredentials = {
  email: 'store@manager.com',
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in as bloodbank manager...');
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

async function testRoutes() {
  const routes = [
    { method: 'GET', url: '/bloodbank-manager/patients', description: 'Get patients' },
    { method: 'GET', url: '/bloodbank-manager/details', description: 'Get bloodbank details' },
    { method: 'GET', url: '/bloodbank-manager/analytics', description: 'Get analytics' },
    { method: 'GET', url: '/bloodbank-manager/staff', description: 'Get staff' },
    { method: 'GET', url: '/bloodbank-manager/bookings', description: 'Get bookings' },
    { method: 'GET', url: '/bloodbank-manager/donation-requests', description: 'Get donation requests' },
    { method: 'GET', url: '/bloodbank-manager/inventory', description: 'Get inventory' }
  ];

  for (const route of routes) {
    try {
      console.log(`\n🌐 Testing ${route.method} ${route.url} - ${route.description}`);
      
      const response = await axios({
        method: route.method,
        url: `${BASE_URL}${route.url}`,
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data.success) {
        console.log(`✅ ${route.description} - Success`);
        if (route.url === '/users/me') {
          console.log('   User data:', response.data.data.name, response.data.data.role);
        } else if (route.url === '/patients') {
          console.log('   Patients count:', response.data.data.length);
        } else if (route.url === '/bloodbank/analytics') {
          console.log('   Analytics overview:', response.data.data.overview);
        } else if (route.url === '/bloodbank/staff') {
          console.log('   Staff count:', response.data.data.length);
        } else if (route.url === '/bloodbank/bookings') {
          console.log('   Bookings count:', response.data.data.length);
        }
      } else {
        console.log(`❌ ${route.description} - Failed:`, response.data.message);
      }
    } catch (error) {
      console.log(`❌ ${route.description} - Error:`, error.response?.data?.message || error.message);
    }
  }
}

async function runTests() {
  console.log('🧪 Starting BloodBank Routes Test\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Test routes
  await testRoutes();

  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(console.error);