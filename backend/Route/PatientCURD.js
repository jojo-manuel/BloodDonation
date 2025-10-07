// routes/patient.js
const express = require("express");
const Patient = require("../Models/Patient");
const authMiddleware = require("../Middleware/authMiddleware");

const router = express.Router();

/**
 * @route   POST /api/patients
 * @desc    Add a new patient (bloodbank and admin can add)
 * @access  Private (BloodBank and Admin)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { patientName, address, bloodGroup, mrid, requiredUnits, requiredDate, bloodBankId } = req.body;

    // Role check
    if (req.user.role !== "bloodbank" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Only blood banks and admins can add patients." });
    }

    // Validation
    if (!patientName || !address || !bloodGroup || !mrid || !requiredUnits || !requiredDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Determine blood bank ID
    let finalBloodBankId = req.user._id;
    if (req.user.role === "admin" && bloodBankId) {
      finalBloodBankId = bloodBankId;
    }

    // Create patient with encrypted data
    const patient = new Patient({
      bloodBankId: finalBloodBankId,
      name: patientName, // This will be encrypted via virtual setter
      address: address,  // This will be encrypted via virtual setter
      bloodGroup,
      mrid: mrid,        // This will be encrypted via virtual setter
      unitsRequired: requiredUnits,
      dateNeeded: requiredDate,
    });

    await patient.save();
    res.status(201).json({ success: true, message: "Patient added successfully", patient });
  } catch (err) {
    console.error("Patient Add Error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "MRID already exists" });
    }
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
    if (req.user.role !== "bloodbank" && req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const patients = await Patient.find({ bloodBankId: req.user._id }).populate('bloodBankId', 'name');
    res.status(200).json({ success: true, data: patients });
  } catch (err) {
    console.error("Fetch Patients Error:", err);
    res.status(500).json({ success: false, message: "Server error while fetching patients" });
  }
});

/**
 * @route   GET /api/patients/admin/all
 * @desc    Get all patients (Admin only)
 * @access  Private (Admin only)
 */
router.get("/admin/all", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const patients = await Patient.find().populate('bloodBankId', 'name address');
    res.status(200).json({ success: true, data: patients });
  } catch (err) {
    console.error("Fetch All Patients Error:", err);
    res.status(500).json({ success: false, message: "Server error while fetching patients" });
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
    if (req.user.role !== "bloodbank" && req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { patientName, address, bloodGroup, requiredUnits, requiredDate } = req.body;

    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: req.params.id, bloodBankId: req.user._id }, // Ensure only the user who added can edit
      {
        name: patientName,
        address,
        bloodGroup,
        unitsRequired: requiredUnits,
        dateNeeded: requiredDate
      },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ success: false, message: "Patient not found or not authorized" });
    }

    res.status(200).json({ success: true, message: "Patient updated successfully", updatedPatient });
  } catch (err) {
    console.error("Update Patient Error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "MRID already exists" });
    }
    res.status(500).json({ success: false, message: "Server error while updating patient" });
  }
});

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete a patient
 * @access  Private (BloodBank only)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "bloodbank" && req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const deletedPatient = await Patient.findOneAndDelete({
      _id: req.params.id,
      bloodBankId: req.user._id,
    });

    if (!deletedPatient) {
      return res.status(404).json({ success: false, message: "Patient not found or not authorized" });
    }

    res.status(200).json({ success: true, message: "Patient deleted successfully" });
  } catch (err) {
    console.error("Delete Patient Error:", err);
    res.status(500).json({ success: false, message: "Server error while deleting patient" });
  }
});

module.exports = router;
