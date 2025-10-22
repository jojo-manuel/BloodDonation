// backend/Route/bloodBankRoutes.js
const express = require("express");
const router = express.Router();
const bloodBankController = require("../controllers/bloodBankController");
const authMiddleware = require("../Middleware/authMiddleware");

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

// Reschedule a booking
router.put(
  "/bookings/reschedule",
  authMiddleware,
  bloodBankController.rescheduleBooking
);

module.exports = router;
