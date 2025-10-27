/**
 * Test Script for Slot Reschedule Notification
 * 
 * This script demonstrates how to trigger a reschedule notification
 * 
 * Usage:
 * 1. Make sure backend server is running
 * 2. Update the variables below with actual IDs
 * 3. Run: node test-reschedule-notification.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const BOOKING_ID = 'YOUR_BOOKING_ID_HERE'; // Replace with actual booking ID
const TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual auth token

// Test reschedule notification
async function testReschedule() {
  try {
    console.log('🧪 Testing Slot Reschedule Notification...\n');
    
    // Calculate new date (3 days from now)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 3);
    const formattedDate = newDate.toISOString().split('T')[0];
    
    const rescheduleData = {
      bookingId: BOOKING_ID,
      newDate: formattedDate,
      newTime: '2:00 PM',
      reason: 'Test reschedule - Staff availability changed'
    };
    
    console.log('📤 Sending reschedule request:');
    console.log(JSON.stringify(rescheduleData, null, 2));
    console.log('');
    
    const response = await axios.post(
      `${API_BASE_URL}/notifications/reschedule`,
      rescheduleData,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('📧 Email sent:', response.data.data.emailSent);
    console.log('📬 Notification ID:', response.data.data._id);
    console.log('');
    console.log('📋 Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Check donor email for reschedule notification');
    console.log('2. Login as donor to see popup modal');
    console.log('3. Acknowledge the notification');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you have a valid authentication token');
    }
    
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Check if the booking ID exists in the database');
    }
  }
}

// Test getting unread notifications
async function testGetUnread() {
  try {
    console.log('\n🧪 Testing Get Unread Notifications...\n');
    
    const response = await axios.get(
      `${API_BASE_URL}/notifications/unread`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('📬 Unread notifications:', response.data.count);
    console.log('');
    console.log('📋 Notifications:');
    console.log(JSON.stringify(response.data.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SLOT RESCHEDULE NOTIFICATION TEST SCRIPT');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Check if required variables are set
  if (BOOKING_ID === 'YOUR_BOOKING_ID_HERE' || TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
    console.log('⚠️  WARNING: Please update the configuration variables first!');
    console.log('');
    console.log('Steps:');
    console.log('1. Open this file in a text editor');
    console.log('2. Replace BOOKING_ID with an actual booking ID');
    console.log('3. Replace TOKEN with your authentication token');
    console.log('');
    console.log('To get your token:');
    console.log('- Login to the application');
    console.log('- Open browser DevTools (F12)');
    console.log('- Go to Application > Local Storage');
    console.log('- Copy the "token" value');
    console.log('');
    process.exit(1);
  }
  
  // Test reschedule
  await testReschedule();
  
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test get unread
  await testGetUnread();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TESTS COMPLETED');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run if executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testReschedule, testGetUnread };

