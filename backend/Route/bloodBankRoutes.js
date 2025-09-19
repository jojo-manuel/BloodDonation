// backend/Route/bloodBankRoutes.js
const express = require("express");
const router = express.Router();
const bloodBankController = require("../controllers/bloodBankController");
const authMiddleware = require("../Middleware/authMiddleware");
const allowRoles = require("../Middleware/roles");

// Blood bank user registration
router.post("/register", (req, res, next) => {
  console.log("[DEBUG] Blood bank registration route hit", req.body);
  return bloodBankController.registerBloodBankUser(req, res, next);
});

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

// All routes below require authentication and bloodbank role
router.use(authMiddleware);
router.use(allowRoles("bloodbank"));

// Get all users
router.get("/users", bloodBankController.getAllUsers);

// Get all donors
router.get("/donors", bloodBankController.getAllDonors);

// Set status for a user
router.put("/users/:id/status", bloodBankController.setUserStatus);

// Set status for a donor
router.put("/donors/:id/status", bloodBankController.setDonorStatus);

// Get donation requests for patients uploaded by the bloodbank
router.get("/donation-requests", bloodBankController.getDonationRequests);

module.exports = router;
