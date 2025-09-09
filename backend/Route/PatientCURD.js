// routes/patient.js
const express = require("express");
const Patient = require("../Models/Patient");
const authMiddleware = require("../Middleware/authMiddleware");

const router = express.Router();

/**
 * @route   POST /api/patients
 * @desc    Add a new patient (only bloodbank can add)
 * @access  Private (BloodBank only)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { patientName, address, bloodGroup, requiredUnits, requiredDate } = req.body;

    // Role check
    if (req.user.role !== "bloodbank") {
      return res.status(403).json({ message: "Access denied. Only blood banks can add patients." });
    }

    // Validation
    if (!patientName || !address || !bloodGroup || !requiredUnits || !requiredDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create patient
    const patient = new Patient({
      bloodBankId: req.user._id,
      patientName,
      address,
      bloodGroup,
      requiredUnits,
      requiredDate,
    });

    await patient.save();
    res.status(201).json({ message: "Patient added successfully", patient });
  } catch (err) {
    console.error("Patient Add Error:", err);
    res.status(500).json({ message: "Server error while adding patient" });
  }
});

/**
 * @route   GET /api/patients
 * @desc    Get all patients added by logged-in blood bank
 * @access  Private (BloodBank only)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "bloodbank") {
      return res.status(403).json({ message: "Access denied" });
    }

    const patients = await Patient.find({ bloodBankId: req.user._id });
    res.status(200).json(patients);
  } catch (err) {
    console.error("Fetch Patients Error:", err);
    res.status(500).json({ message: "Server error while fetching patients" });
  }
});

/**
 * @route   GET /api/patients/mrid/:mrid
 * @desc    Get a patient by MRID (only user with matching MRID can view)
 * @access  Private (User with MRID only)
 */
router.get("/mrid/:mrid", authMiddleware, async (req, res) => {
  try {
    // Only allow users with matching MRID to view their record
    if (req.user.role !== "user" || req.user.mrid !== req.params.mrid) {
      return res.status(403).json({ message: "Access denied. Only the patient with this MRID can view their record." });
    }
    const patient = await Patient.findOne({ mrid: req.params.mrid });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json(patient);
  } catch (err) {
    console.error("Get Patient by MRID Error:", err);
    res.status(500).json({ message: "Server error while fetching patient" });
  }
});

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient details
 * @access  Private (BloodBank only)
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "bloodbank") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { patientName, address, bloodGroup, requiredUnits, requiredDate } = req.body;

    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: req.params.id, bloodBankId: req.user._id }, // Ensure only the bloodbank who added can edit
      { patientName, address, bloodGroup, requiredUnits, requiredDate },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found or not authorized" });
    }

    res.status(200).json({ message: "Patient updated successfully", updatedPatient });
  } catch (err) {
    console.error("Update Patient Error:", err);
    res.status(500).json({ message: "Server error while updating patient" });
  }
});

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete a patient
 * @access  Private (BloodBank only)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "bloodbank") {
      return res.status(403).json({ message: "Access denied" });
    }

    const deletedPatient = await Patient.findOneAndDelete({
      _id: req.params.id,
      bloodBankId: req.user._id,
    });

    if (!deletedPatient) {
      return res.status(404).json({ message: "Patient not found or not authorized" });
    }

    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (err) {
    console.error("Delete Patient Error:", err);
    res.status(500).json({ message: "Server error while deleting patient" });
  }
});

module.exports = router;
