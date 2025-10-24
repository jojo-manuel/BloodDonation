/**
 * Taxi Partner Integration Example
 * 
 * This file demonstrates how third-party taxi service providers
 * can integrate with the Blood Donation Taxi Booking System API.
 * 
 * Base URL: http://localhost:5000/api/taxi/partner
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api/taxi/partner';
const AUTH_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Replace with actual token

// Axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// ==============================================
// 1. FETCH AVAILABLE BOOKINGS
// ==============================================

/**
 * Get all available bookings awaiting driver assignment
 */
async function fetchAvailableBookings() {
  try {
    console.log('📥 Fetching available bookings...\n');
    
    const response = await api.get('/available-bookings');
    
    if (response.data.success) {
      const bookings = response.data.data;
      console.log(`✅ Found ${bookings.length} available bookings:\n`);
      
      bookings.forEach((booking, index) => {
        console.log(`Booking ${index + 1}:`);
        console.log(`  ID: ${booking.bookingId}`);
        console.log(`  Passenger: ${booking.passengerName}`);
        console.log(`  Phone: ${booking.passengerPhone}`);
        console.log(`  Pickup: ${booking.pickupAddress}`);
        console.log(`  Drop: ${booking.dropAddress}`);
        console.log(`  Distance: ${booking.distanceKm} km`);
        console.log(`  Fare: ₹${booking.fare}`);
        console.log(`  Date: ${booking.scheduledDate}`);
        console.log(`  Time: ${booking.scheduledTime}`);
        console.log(`  Priority: ${booking.priority}`);
        console.log(`  Special Instructions: ${booking.specialInstructions || 'None'}`);
        console.log('---\n');
      });
      
      return bookings;
    }
  } catch (error) {
    console.error('❌ Error fetching bookings:', error.response?.data || error.message);
    return [];
  }
}

// ==============================================
// 2. GET SPECIFIC BOOKING DETAILS
// ==============================================

/**
 * Get detailed information about a specific booking
 * @param {string} bookingId - The unique booking ID
 */
async function getBookingDetails(bookingId) {
  try {
    console.log(`📋 Fetching details for booking ${bookingId}...\n`);
    
    const response = await api.get(`/booking/${bookingId}`);
    
    if (response.data.success) {
      const booking = response.data.data;
      console.log('✅ Booking Details:');
      console.log(`  Passenger: ${booking.passengerName} (${booking.passengerPhone})`);
      console.log(`  Pickup: ${booking.pickupAddress}`);
      console.log(`  Drop: ${booking.dropAddress}`);
      console.log(`  Scheduled: ${booking.scheduledDate} at ${booking.scheduledTime}`);
      console.log(`  Distance: ${booking.distanceKm} km`);
      console.log(`  Fare: ₹${booking.fare}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Payment: ${booking.paymentStatus}`);
      console.log(`  Blood Bank: ${booking.bloodBankName}`);
      console.log(`  Special Instructions: ${booking.specialInstructions || 'None'}\n`);
      
      return booking;
    }
  } catch (error) {
    console.error('❌ Error fetching booking details:', error.response?.data || error.message);
    return null;
  }
}

// ==============================================
// 3. ASSIGN DRIVER TO BOOKING
// ==============================================

/**
 * Assign a driver and vehicle to a booking
 * @param {string} bookingId - The booking ID
 * @param {object} driverInfo - Driver and vehicle information
 */
async function assignDriverToBooking(bookingId, driverInfo) {
  try {
    console.log(`🚗 Assigning driver to booking ${bookingId}...\n`);
    
    const response = await api.put(`/assign-driver/${bookingId}`, {
      driverName: driverInfo.name,
      driverPhone: driverInfo.phone,
      vehicleNumber: driverInfo.vehicleNumber,
      vehicleType: driverInfo.vehicleType || 'Sedan'
    });
    
    if (response.data.success) {
      console.log('✅ Driver assigned successfully!');
      console.log(`  Driver: ${driverInfo.name}`);
      console.log(`  Phone: ${driverInfo.phone}`);
      console.log(`  Vehicle: ${driverInfo.vehicleNumber} (${driverInfo.vehicleType})`);
      console.log(`  New Status: ${response.data.data.status}\n`);
      
      return response.data.data;
    }
  } catch (error) {
    console.error('❌ Error assigning driver:', error.response?.data || error.message);
    return null;
  }
}

// ==============================================
// 4. UPDATE BOOKING STATUS
// ==============================================

/**
 * Update the status of a booking
 * @param {string} bookingId - The booking ID
 * @param {string} status - New status (assigned, in_transit, completed, cancelled)
 * @param {string} notes - Optional notes
 */
async function updateBookingStatus(bookingId, status, notes = '') {
  try {
    console.log(`📝 Updating booking ${bookingId} to status: ${status}...\n`);
    
    const response = await api.put(`/update-status/${bookingId}`, {
      status,
      notes
    });
    
    if (response.data.success) {
      console.log('✅ Status updated successfully!');
      console.log(`  New Status: ${status}`);
      console.log(`  Updated At: ${response.data.data.updatedAt}\n`);
      
      return response.data.data;
    }
  } catch (error) {
    console.error('❌ Error updating status:', error.response?.data || error.message);
    return null;
  }
}

// ==============================================
// 5. GET DRIVER'S ACTIVE BOOKINGS
// ==============================================

/**
 * Get all active bookings for a specific driver
 * @param {string} driverPhone - Driver's phone number
 */
async function getDriverActiveBookings(driverPhone) {
  try {
    console.log(`👤 Fetching active bookings for driver ${driverPhone}...\n`);
    
    const response = await api.get('/driver-bookings', {
      params: { driverPhone }
    });
    
    if (response.data.success) {
      const bookings = response.data.data;
      console.log(`✅ Found ${bookings.length} active bookings for this driver:\n`);
      
      bookings.forEach((booking, index) => {
        console.log(`Booking ${index + 1}:`);
        console.log(`  ID: ${booking.bookingId}`);
        console.log(`  Passenger: ${booking.passengerName}`);
        console.log(`  Pickup: ${booking.pickupAddress}`);
        console.log(`  Drop: ${booking.dropAddress}`);
        console.log(`  Scheduled: ${booking.scheduledDate} at ${booking.scheduledTime}`);
        console.log(`  Status: ${booking.status}\n`);
      });
      
      return bookings;
    }
  } catch (error) {
    console.error('❌ Error fetching driver bookings:', error.response?.data || error.message);
    return [];
  }
}

// ==============================================
// COMPLETE WORKFLOW EXAMPLE
// ==============================================

/**
 * Demonstrates a complete workflow from booking to completion
 */
async function completeWorkflowExample() {
  console.log('🚀 Starting Complete Taxi Booking Workflow Example\n');
  console.log('=' .repeat(60) + '\n');
  
  // Step 1: Fetch available bookings
  console.log('STEP 1: Fetch Available Bookings');
  console.log('-'.repeat(60));
  const availableBookings = await fetchAvailableBookings();
  
  if (availableBookings.length === 0) {
    console.log('No available bookings at the moment.\n');
    return;
  }
  
  // Step 2: Select first booking for this example
  const selectedBooking = availableBookings[0];
  console.log(`\n📌 Selected Booking: ${selectedBooking.bookingId}\n`);
  
  // Step 3: Get detailed information
  console.log('STEP 2: Get Booking Details');
  console.log('-'.repeat(60));
  await getBookingDetails(selectedBooking.bookingId);
  
  // Step 4: Assign a driver
  console.log('STEP 3: Assign Driver');
  console.log('-'.repeat(60));
  const driverInfo = {
    name: 'Rajesh Kumar',
    phone: '+919988776655',
    vehicleNumber: 'MH-02-AB-1234',
    vehicleType: 'Sedan'
  };
  await assignDriverToBooking(selectedBooking.bookingId, driverInfo);
  
  // Step 5: Update to in_transit
  console.log('STEP 4: Update Status - In Transit');
  console.log('-'.repeat(60));
  await updateBookingStatus(
    selectedBooking.bookingId,
    'in_transit',
    'Driver picked up passenger and heading to blood bank'
  );
  
  // Step 6: Check driver's active bookings
  console.log('STEP 5: Check Driver Active Bookings');
  console.log('-'.repeat(60));
  await getDriverActiveBookings(driverInfo.phone);
  
  // Step 7: Complete the booking
  console.log('STEP 6: Complete Booking');
  console.log('-'.repeat(60));
  await updateBookingStatus(
    selectedBooking.bookingId,
    'completed',
    'Trip completed successfully. Passenger dropped at blood bank.'
  );
  
  console.log('=' .repeat(60));
  console.log('✅ Complete workflow executed successfully!\n');
}

// ==============================================
// POLLING SYSTEM FOR REAL-TIME UPDATES
// ==============================================

/**
 * Poll for new bookings every 60 seconds
 * In production, consider using webhooks for real-time notifications
 */
function startPollingForBookings() {
  console.log('🔄 Starting polling system (checking every 60 seconds)...\n');
  
  // Initial fetch
  fetchAvailableBookings();
  
  // Poll every 60 seconds
  setInterval(async () => {
    console.log('🔄 Polling for new bookings...\n');
    const bookings = await fetchAvailableBookings();
    
    if (bookings.length > 0) {
      console.log(`🔔 ALERT: ${bookings.length} booking(s) awaiting assignment!\n`);
      // Here you can trigger notifications to available drivers
    }
  }, 60000); // 60 seconds
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Calculate ETA based on current location and destination
 * @param {object} currentLocation - { latitude, longitude }
 * @param {object} destination - { latitude, longitude }
 * @param {number} averageSpeed - Average speed in km/h (default: 50)
 */
function calculateETA(currentLocation, destination, averageSpeed = 50) {
  // Haversine formula to calculate distance
  const R = 6371; // Earth's radius in km
  
  const dLat = (destination.latitude - currentLocation.latitude) * Math.PI / 180;
  const dLon = (destination.longitude - currentLocation.longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(currentLocation.latitude * Math.PI / 180) * 
    Math.cos(destination.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Calculate time in minutes
  const timeInMinutes = Math.ceil((distance / averageSpeed) * 60);
  
  return {
    distanceKm: Math.round(distance * 10) / 10,
    etaMinutes: timeInMinutes,
    etaFormatted: `${Math.floor(timeInMinutes / 60)}h ${timeInMinutes % 60}m`
  };
}

/**
 * Format booking for driver app display
 * @param {object} booking - Raw booking object
 */
function formatBookingForDriver(booking) {
  return {
    id: booking.bookingId,
    passenger: {
      name: booking.passengerName,
      phone: booking.passengerPhone
    },
    pickup: {
      address: booking.pickupAddress,
      coordinates: booking.pickupLocation
    },
    drop: {
      address: booking.dropAddress,
      coordinates: booking.dropLocation
    },
    schedule: {
      date: booking.scheduledDate,
      time: booking.scheduledTime
    },
    trip: {
      distance: `${booking.distanceKm} km`,
      fare: `₹${booking.fare}`,
      estimatedDuration: `${Math.ceil((booking.distanceKm / 50) * 60)} min`
    },
    instructions: booking.specialInstructions,
    priority: booking.priority === 'high' ? '🔴 High Priority - Blood Donation' : 'Normal'
  };
}

// ==============================================
// MAIN EXECUTION
// ==============================================

// Uncomment the function you want to run:

// Run complete workflow example
// completeWorkflowExample();

// Or start polling for bookings
// startPollingForBookings();

// Or run individual functions:
// fetchAvailableBookings();
// getBookingDetails('BOOKING_ID_HERE');
// assignDriverToBooking('BOOKING_ID_HERE', { name: 'Driver Name', phone: '+91...', vehicleNumber: 'MH-XX-XXXX' });
// updateBookingStatus('BOOKING_ID_HERE', 'in_transit', 'Notes here');
// getDriverActiveBookings('+919988776655');

// Example: Calculate ETA
const currentLocation = { latitude: 19.0760, longitude: 72.8777 };
const destination = { latitude: 19.1136, longitude: 72.8697 };
const eta = calculateETA(currentLocation, destination);
console.log('📍 ETA Calculation Example:');
console.log(`Distance: ${eta.distanceKm} km`);
console.log(`ETA: ${eta.etaMinutes} minutes (${eta.etaFormatted})\n`);

// ==============================================
// EXPORTS (for use in other modules)
// ==============================================

module.exports = {
  fetchAvailableBookings,
  getBookingDetails,
  assignDriverToBooking,
  updateBookingStatus,
  getDriverActiveBookings,
  calculateETA,
  formatBookingForDriver,
  startPollingForBookings,
  completeWorkflowExample
};

/**
 * USAGE NOTES:
 * 
 * 1. Replace AUTH_TOKEN with your actual API access token
 * 2. Adjust API_BASE_URL for production environment
 * 3. Install dependencies: npm install axios
 * 4. Run: node taxi-partner-integration-example.js
 * 
 * BEST PRACTICES:
 * 
 * - Poll for bookings every 30-60 seconds (or use webhooks)
 * - Update status promptly as trips progress
 * - Handle errors gracefully with retry logic
 * - Store booking IDs locally for reference
 * - Validate data before sending to API
 * - Use HTTPS in production
 * - Keep API tokens secure
 * - Respect rate limits
 * 
 * PRODUCTION CONSIDERATIONS:
 * 
 * - Implement proper error logging
 * - Add retry mechanism for failed requests
 * - Use environment variables for configuration
 * - Implement webhook listeners for real-time updates
 * - Add monitoring and alerting
 * - Use connection pooling for database
 * - Implement rate limiting on your end
 * - Add request/response logging for debugging
 */

