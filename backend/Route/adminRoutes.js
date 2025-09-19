const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const allowRoles = require("../Middleware/roles");
const authMiddleware = require("../Middleware/authMiddleware");

// Admin registration route (no auth required)
router.post("/register", adminController.registerAdmin);

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(allowRoles("admin"));

// Get all donors
router.get("/donors", adminController.getAllDonors);

// Request donation from donor
router.post("/donors/:id/request-donation", adminController.requestDonation);

// Get all users
router.get("/users", adminController.getAllUsers);

// Get all admins
router.get("/admins", adminController.getAllAdmins);

// Get all bloodbanks
router.get("/bloodbanks", adminController.getAllBloodBanks);

// Approve bloodbank
router.put("/bloodbanks/:id/approve", adminController.approveBloodBank);

// Reject bloodbank
router.put("/bloodbanks/:id/reject", adminController.rejectBloodBank);

// Get all patients
router.get("/patients", adminController.getAllPatients);

// Set status for user
router.put("/users/:id/status", adminController.setUserStatus);

// Set status for donor
router.put("/donors/:id/status", adminController.setDonorStatus);

// Set status for bloodbank
router.put("/bloodbanks/:id/status", adminController.setBloodBankStatus);

module.exports = router;
