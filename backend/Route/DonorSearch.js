// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const Patient = require("../Models/Patient");
const Donor = require("../Models/donor");

/**
 * @route   GET /api/users/search-donors/:mrid
 * @desc    Search blood donors based on patient's active blood request
 * @access  Public (or Authenticated if you need auth)
 */
router.get("/search-donors/:mrid", async (req, res) => {
  try {
    const { mrid } = req.params;

    // Step 1: Find the patient request by MRID (normalize to uppercase)
    const patient = await Patient.findOne({ mrid: mrid.toUpperCase() });

    // Step 2: If patient not found → return error
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Step 3: Check if request is active (blood bank should activate request)
    if (!patient.isActiveRequest) {
      return res.status(400).json({
        message: "This patient's request is not yet activated by the blood bank.",
      });
    }

    // Step 4: Extract the blood group from patient details
    const requiredBloodGroup = patient.bloodGroup;

    // Step 5: Search donors with the same blood group
    const donors = await Donor.find({ bloodGroup: requiredBloodGroup });

    // Step 6: If no donors found → notify user
    if (donors.length === 0) {
      return res
        .status(404)
        .json({ message: "No donors available for this blood group at the moment." });
    }

    // Step 7: Return matching donors
    res.status(200).json({
      patient: {
        name: patient.name,
        mrid: patient.mrid,
        bloodGroup: patient.bloodGroup,
        unitsRequired: patient.unitsRequired,
        requestDate: patient.requestDate,
        neededByDate: patient.neededByDate,
      },
      matchingDonors: donors,
    });
  } catch (error) {
    console.error("Error while searching donors:", error.message);
    res.status(500).json({ message: "Server error while searching donors." });
  }
});

module.exports = router;
