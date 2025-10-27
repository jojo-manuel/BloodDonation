const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const taxiController = require('../controllers/taxiController');

// All routes require authentication
router.use(authMiddleware);

// Calculate fare for taxi booking
router.post('/calculate-fare', taxiController.calculateFare);

// Create Razorpay order
router.post('/create-order', taxiController.createOrder);

// Verify payment and create booking
router.post('/verify-payment', taxiController.verifyPayment);

// Get user's taxi bookings
router.get('/my-bookings', taxiController.getMyBookings);

// Check if taxi booking exists for a donation request
router.get('/check/:donationRequestId', taxiController.checkTaxiBooking);

// Cancel booking
router.put('/:bookingId/cancel', taxiController.cancelBooking);

// =============================================
// TAXI PARTNER API ROUTES
// For third-party taxi service providers
// =============================================

// Get all available bookings for taxi partners
router.get('/partner/available-bookings', taxiController.getAvailableBookings);

// Get specific booking details
router.get('/partner/booking/:bookingId', taxiController.getBookingDetails);

// Assign driver to booking
router.put('/partner/assign-driver/:bookingId', taxiController.assignDriver);

// Update booking status
router.put('/partner/update-status/:bookingId', taxiController.updateBookingStatus);

// Get bookings assigned to a specific driver
router.get('/partner/driver-bookings', taxiController.getDriverBookings);

module.exports = router;

