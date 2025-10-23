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

// Cancel booking
router.put('/:bookingId/cancel', taxiController.cancelBooking);

module.exports = router;

