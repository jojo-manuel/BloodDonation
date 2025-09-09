const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const allowRoles = require("../Middleware/roles");
const authMiddleware = require("../Middleware/authMiddleware");

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(allowRoles("admin"));

// Get all donors
router.get("/donors", adminController.getAllDonors);

// Get all users
router.get("/users", adminController.getAllUsers);

// Get all bloodbanks
router.get("/bloodbanks", adminController.getAllBloodBanks);

// Approve bloodbank
router.put("/bloodbanks/:id/approve", adminController.approveBloodBank);

// Reject bloodbank
router.put("/bloodbanks/:id/reject", adminController.rejectBloodBank);

module.exports = router;
