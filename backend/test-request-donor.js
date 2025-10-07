const http = require('http');
const mongoose = require('mongoose');
const User = require('./Models/User');
const Donor = require('./Models/donor');
const DonationRequest = require('./Models/DonationRequest');
const BloodBank = require('./Models/BloodBank');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  username: 'test_requester_' + Date.now(),
  password: 'testpass123',
  email: 'test_requester@example.com',
  name: 'Test Requester',
  phone: '1234567890'
};

const TEST_DONOR = {
  username: 'test_donor_' + Date.now(),
  password: 'testpass123',
  email: 'test_donor@example.com',
  name: 'Test Donor',
  phone: '0987654321'
};

const TEST_BLOODBANK = {
  username: 'test_bloodbank_' + Date.now(),
  password: 'testpass123',
  email: 'test_bloodbank@example.com',
  name: 'Test Blood Bank',
  phone: '1122334455'
};

let requesterToken = '';
let donorToken = '';
let bloodBankToken = '';
let testDonorId = '';
let testBloodBankId = '';
let testRequestId = '';

/**
 * Helper function to make HTTP requests
 */
function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(responseData)
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Helper function to register a user and get token
 */
async function registerUser(userData) {
  try {
    const response = await makeRequest('/api/auth/register', 'POST', userData);
    if (response.statusCode === 201 && response.body.success) {
      // After registration, we need to login to get the token
      const loginResponse = await makeRequest('/api/auth/login', 'POST', {
        username: userData.username,
        password: userData.password
      });
      if (loginResponse.statusCode === 200 && loginResponse.body.success) {
        return loginResponse.body.data.accessToken;
      }
      throw new Error(`Login after registration failed: ${loginResponse.body.message}`);
    }
    throw new Error(`Registration failed: ${response.body.message}`);
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Helper function to register a donor
 */
async function registerDonor(token, donorData) {
  try {
    const response = await makeRequest('/api/donors/register', 'POST', donorData, token);
    if (response.statusCode === 201 && response.body.success) {
      return response.body.data._id;
    }
    throw new Error(`Donor registration failed: ${response.body.message}`);
  } catch (error) {
    console.error('Donor registration error:', error);
    throw error;
  }
}

/**
 * Helper function to register a blood bank
 */
async function registerBloodBank(token, bloodBankData) {
  try {
    const response = await makeRequest('/api/bloodbank/register', 'POST', bloodBankData, token);
    if (response.statusCode === 201 && response.body.success) {
      return response.body.data._id;
    }
    throw new Error(`Blood bank registration failed: ${response.body.message}`);
  } catch (error) {
    console.error('Blood bank registration error:', error);
    throw error;
  }
}

/**
 * Test the complete request donor flow
 */
async function testRequestDonorFlow() {
  console.log('🩸 Testing Request Donor Functionality\n');

  try {
    // Step 1: Register test users
    console.log('Step 1: Registering test users...');
    requesterToken = await registerUser(TEST_USER);
    donorToken = await registerUser(TEST_DONOR);
    bloodBankToken = await registerUser(TEST_BLOODBANK);
    console.log('✅ Users registered successfully\n');

    // Step 2: Register donor and blood bank
    console.log('Step 2: Registering donor and blood bank...');
    testDonorId = await registerDonor(donorToken, {
      name: 'Test Donor',
      dob: '1990-01-01',
      gender: 'male',
      bloodGroup: 'O+',
      contactNumber: '0987654321',
      emergencyContactNumber: '1122334455',
      houseAddress: {
        street: '123 Test Street',
        city: 'Test City',
        district: 'Test District',
        pincode: '123456'
      },
      workAddress: {
        street: '456 Work Street',
        city: 'Work City',
        district: 'Work District',
        pincode: '654321'
      },
      weight: 70,
      availability: true,
      contactPreference: 'email',
      phone: '0987654321'
    });

    testBloodBankId = await registerBloodBank(bloodBankToken, {
      name: 'Test Blood Bank',
      address: '789 Test Avenue, Test City',
      phone: '1122334455',
      email: 'test_bloodbank@example.com',
      licenseNumber: 'LIC123456',
      operatingHours: '9 AM - 5 PM',
      services: ['Blood Donation', 'Blood Testing'],
      contactPerson: 'Test Manager'
    });
    console.log('✅ Donor and blood bank registered successfully\n');

    // Step 3: Test requesting a donation
    console.log('Step 3: Testing donation request...');
    const requestResponse = await makeRequest('/api/users/request-donation', 'POST', {
      donorId: testDonorId,
      bloodBankId: testBloodBankId,
      requestedDate: '2024-12-25',
      requestedTime: '10:00 AM',
      message: 'Urgent blood donation needed for patient'
    }, requesterToken);

    console.log(`Status: ${requestResponse.statusCode}`);
    if (requestResponse.statusCode === 200 && requestResponse.body.success) {
      testRequestId = requestResponse.body.data._id;
      console.log('✅ Donation request sent successfully');
      console.log(`   Request ID: ${testRequestId}\n`);
    } else {
      console.log('❌ Donation request failed:', requestResponse.body.message);
      return;
    }

    // Step 4: Test getting incoming requests for donor
    console.log('Step 4: Testing get incoming requests...');
    const incomingRequestsResponse = await makeRequest('/api/donors/requests', 'GET', null, donorToken);

    console.log(`Status: ${incomingRequestsResponse.statusCode}`);
    if (incomingRequestsResponse.statusCode === 200 && incomingRequestsResponse.body.success) {
      console.log('✅ Incoming requests retrieved successfully');
      console.log(`   Number of requests: ${incomingRequestsResponse.body.data.length}\n`);
    } else {
      console.log('❌ Get incoming requests failed:', incomingRequestsResponse.body.message);
      return;
    }

    // Step 5: Test accepting the request
    console.log('Step 5: Testing accept request...');
    const acceptResponse = await makeRequest(`/api/donors/requests/${testRequestId}/respond`, 'PUT', {
      status: 'accepted'
    }, donorToken);

    console.log(`Status: ${acceptResponse.statusCode}`);
    if (acceptResponse.statusCode === 200 && acceptResponse.body.success) {
      console.log('✅ Request accepted successfully\n');
    } else {
      console.log('❌ Accept request failed:', acceptResponse.body.message);
      return;
    }

    // Step 6: Test declining a request (create another request first)
    console.log('Step 6: Testing decline request...');

    // Create another request for declining
    const declineRequestResponse = await makeRequest('/api/users/request-donation', 'POST', {
      donorId: testDonorId,
      bloodBankId: testBloodBankId,
      requestedDate: '2024-12-26',
      requestedTime: '11:00 AM',
      message: 'Another urgent request'
    }, requesterToken);

    if (declineRequestResponse.statusCode === 200 && declineRequestResponse.body.success) {
      const declineRequestId = declineRequestResponse.body.data._id;

      const declineResponse = await makeRequest(`/api/donors/requests/${declineRequestId}/respond`, 'PUT', {
        status: 'rejected'
      }, donorToken);

      console.log(`Status: ${declineResponse.statusCode}`);
      if (declineResponse.statusCode === 200 && declineResponse.body.success) {
        console.log('✅ Request declined successfully\n');
      } else {
        console.log('❌ Decline request failed:', declineResponse.body.message);
      }
    } else {
      console.log('❌ Could not create request for decline test:', declineRequestResponse.body.message);
    }

    // Step 7: Test getting my requests (for requester)
    console.log('Step 7: Testing get my requests...');
    const myRequestsResponse = await makeRequest('/api/users/my-requests', 'GET', null, requesterToken);

    console.log(`Status: ${myRequestsResponse.statusCode}`);
    if (myRequestsResponse.statusCode === 200 && myRequestsResponse.body.success) {
      console.log('✅ My requests retrieved successfully');
      console.log(`   Number of requests: ${myRequestsResponse.body.data.length}\n`);
    } else {
      console.log('❌ Get my requests failed:', myRequestsResponse.body.message);
    }

    console.log('🎉 All request donor tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Cleanup function to remove test data
 */
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Remove test users
    await User.deleteMany({
      username: { $in: [TEST_USER.username, TEST_DONOR.username, TEST_BLOODBANK.username] }
    });

    // Remove test donor
    if (testDonorId) {
      await Donor.findByIdAndDelete(testDonorId);
    }

    // Remove test blood bank
    if (testBloodBankId) {
      await BloodBank.findByIdAndDelete(testBloodBankId);
    }

    // Remove test requests
    if (testRequestId) {
      await DonationRequest.findByIdAndDelete(testRequestId);
    }

    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Run the test
async function runTest() {
  try {
    await testRequestDonorFlow();
  } finally {
    await cleanup();
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted, cleaning up...');
  await cleanup();
  process.exit(0);
});

console.log('🚀 Starting Request Donor Functionality Test...\n');

// Check if server is running
makeRequest('/api/auth/health', 'GET')
  .then(() => {
    console.log('✅ Server is running, starting tests...\n');
    runTest();
  })
  .catch((error) => {
    console.error('❌ Server is not running. Please start the server first.');
    console.log('Run: npm start or node server.js');
    process.exit(1);
  });
