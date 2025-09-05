// routes/donorRoutes.js
const express = require("express");
const Donor = require("../Models/donor");

const router = express.Router();

/**
 * ✅ CREATE Donor (Registration)
 */
router.post("/donors", async (req, res) => {
  try {
    const {
      userId, name, dob, gender, bloodGroup, contactNumber,
      emergencyContactNumber, houseAddress, workAddress,
      lastDonatedDate, priorityPoints, donatedDates
    } = req.body;

    // Basic validation check
    if (!userId || !name || !dob || !gender || !bloodGroup || !contactNumber ||
        !emergencyContactNumber || !houseAddress || !workAddress) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // Create donor
    const donor = new Donor({
      userId, name, dob, gender, bloodGroup, contactNumber,
      emergencyContactNumber, houseAddress, workAddress,
      lastDonatedDate, priorityPoints, donatedDates
    });

    await donor.save();
    res.status(201).json({ message: "Donor registered successfully", donor });
  } catch (error) {
    console.error("Error creating donor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ READ All Donors
 */
router.get("/donors", async (req, res) => {
  try {
    const donors = await Donor.find().populate("userId", "username role");
    res.status(200).json(donors);
  } catch (error) {
    console.error("Error fetching donors:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ READ Single Donor by ID
 */
router.get("/donors/:id", async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).populate("userId", "username role");
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }
    res.status(200).json(donor);
  } catch (error) {
    console.error("Error fetching donor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ UPDATE Donor by ID
 */
router.put("/donors/:id", async (req, res) => {
  try {
    const updates = req.body;

    // Prevent updating to same emergency & contact number
    if (updates.contactNumber && updates.emergencyContactNumber &&
        updates.contactNumber === updates.emergencyContactNumber) {
      return res.status(400).json({ message: "Contact and emergency numbers must be different" });
    }

    const donor = await Donor.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    res.status(200).json({ message: "Donor updated successfully", donor });
  } catch (error) {
    console.error("Error updating donor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ✅ DELETE Donor by ID
 */
router.delete("/donors/:id", async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }
    res.status(200).json({ message: "Donor deleted successfully" });
  } catch (error) {
    console.error("Error deleting donor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
