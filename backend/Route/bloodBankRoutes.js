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

module.exports = router;
