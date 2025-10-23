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

// Get all bookings for the blood bank
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
