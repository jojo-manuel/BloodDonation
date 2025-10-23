// Test Login Debug Script
// Run this to test what's happening with the login endpoint

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

async function testLogin() {
  console.log('\n🔍 Testing Login Endpoint\n');
  console.log('='.repeat(60));
  
  // Test 1: Login with email and password
  console.log('\n📝 Test 1: Login with email field');
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email: 'test@example.com',
      password: 'Test123!'
    });
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.log('❌ Error Status:', error.response?.status);
    console.log('❌ Error Data:', error.response?.data);
  }
  
  // Test 2: Login with username and password
  console.log('\n📝 Test 2: Login with username field');
  try {
    const response = await axios.post(`${API_URL}/login`, {
      username: 'test@example.com',
      password: 'Test123!'
    });
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.log('❌ Error Status:', error.response?.status);
    console.log('❌ Error Data:', error.response?.data);
  }
  
  // Test 3: Empty password
  console.log('\n📝 Test 3: Empty password');
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email: 'test@example.com',
      password: ''
    });
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.log('❌ Error Status:', error.response?.status);
    console.log('❌ Error Data:', error.response?.data);
  }
  
  // Test 4: Empty email
  console.log('\n📝 Test 4: Empty email');
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email: '',
      password: 'Test123!'
    });
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.log('❌ Error Status:', error.response?.status);
    console.log('❌ Error Data:', error.response?.data);
  }
  
  // Test 5: No body
  console.log('\n📝 Test 5: Empty body');
  try {
    const response = await axios.post(`${API_URL}/login`, {});
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.log('❌ Error Status:', error.response?.status);
    console.log('❌ Error Data:', error.response?.data);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Check the actual values being sent from your frontend.');
  console.log('   Open browser DevTools → Network → Click the failed request → Payload\n');
}

// Check if server is running first
axios.get('http://localhost:5000')
  .then(() => {
    console.log('✅ Backend server is running');
    testLogin();
  })
  .catch(() => {
    console.log('❌ Backend server is NOT running!');
    console.log('   Please start it first: cd backend && node server.js');
  });

