// backend/Route/bloodBankRoutes.js
const express = require("express");
const router = express.Router();
const bloodBankController = require("../controllers/bloodBankController");
const authMiddleware = require("../Middleware/authMiddleware");

// Get all approved blood banks (public endpoint for dropdowns)
router.get("/approved", bloodBankController.getApprovedBloodBanks);

// Blood bank user registration
router.post("/register", bloodBankController.registerBloodBankUser);

// Submit blood bank details for approval (protected route)
router.post(
  "/submit-details",
  authMiddleware,
  bloodBankController.submitBloodBankDetails
);

// Get blood bank details by userId (protected route)
router.get(
  "/details",
  authMiddleware,
  bloodBankController.getBloodBankByUser
);

// Get donation requests received by the blood bank (not yet booked)
router.get(
  "/donation-requests",
  authMiddleware,
  bloodBankController.getDonationRequests
);

// Confirm/accept a donation request and create a booking
router.post(
  "/bookings/confirm",
  authMiddleware,
  bloodBankController.createBooking
);

// Get all bookings for the blood bank (confirmed bookings)
router.get(
  "/bookings",
  authMiddleware,
  bloodBankController.getBookingsForBloodBank
);

// Get booking by token number (frontdesk)
router.get(
  "/bookings/token/:tokenNumber",
  authMiddleware,
  bloodBankController.getBookingByToken
);

// Get all donors who have visited with their visit history
router.get(
  "/visited-donors",
  authMiddleware,
  bloodBankController.getVisitedDonors
);

// Update booking status (confirm/reject/cancel/complete)
router.put(
  "/bookings/:bookingId/status",
  authMiddleware,
  bloodBankController.updateBookingStatus
);

// Reschedule a specific booking
router.put(
  "/bookings/:bookingId/reschedule",
  authMiddleware,
  bloodBankController.rescheduleBooking
);

// Old reschedule route (keeping for backwards compatibility)
router.put(
  "/bookings/reschedule",
  authMiddleware,
  bloodBankController.rescheduleBooking
);

module.exports = router;
