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
    if (!patientName || !address || !bloodGroup || !requiredUnits || !requiredDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Specific validation for MRID
    if (!mrid || mrid === null || mrid === undefined || mrid.trim() === '') {
      return res.status(400).json({ success: false, message: "MRID is required and cannot be empty" });
    }

  // Removed phone number validation

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
      // Duplicate key error, check if it's MRID or phone number unique constraint
      if (err.keyPattern && err.keyPattern.encryptedMrid) {
        return res.status(400).json({ success: false, message: "MR number already exists" });
      }
  // Removed phone number duplicate key error
      return res.status(400).json({ success: false, message: "Duplicate key error" });
    }
    res.status(500).json({ message: "Server error while adding patient" });
  }
});

/**
 * @route   GET /api/patients
 * @desc    Get all patients added by logged-in blood bank (excluding soft deleted)
 * @access  Private (BloodBank only)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "bloodbank" && req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const patients = await Patient.find({
      bloodBankId: req.user._id,
      isDeleted: false
    }).populate('bloodBankId', 'name');
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
 * @route   GET /api/patients/search/:mrid
 * @desc    Get patient details by MRID for donor search (users, donors, and admins can search)
 * @access  Private (User, Donor, Admin)
 */
router.get("/search/:mrid", async (req, res) => {
  try {
    // Remove role check to allow public access for fetching patient data by MRID
    const { encrypt } = require('../utils/encryption');
    const encryptedMrid = encrypt(req.params.mrid.toUpperCase());
    const patient = await Patient.findOne({ encryptedMrid });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    res.status(200).json({ success: true, data: { bloodGroup: patient.bloodGroup, address: patient.address, name: patient.name } });
  } catch (err) {
    console.error("Search Patient by MRID Error:", err);
    res.status(500).json({ success: false, message: "Server error while fetching patient" });
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

    // Removed phone number validation and update
    const updateData = {
      name: patientName,
      address,
      bloodGroup,
      unitsRequired: requiredUnits,
      dateNeeded: requiredDate
    };

    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: req.params.id, bloodBankId: req.user._id }, // Ensure only the user who added can edit
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ success: false, message: "Patient not found or not authorized" });
    }

    res.status(200).json({ success: true, message: "Patient updated successfully", updatedPatient });
  } catch (err) {
    console.error("Update Patient Error:", err);
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.encryptedMrid) {
        return res.status(400).json({ success: false, message: "MRID already exists" });
      }
  // Removed phone number duplicate key error
      return res.status(400).json({ success: false, message: "Duplicate key error" });
    }
    res.status(500).json({ success: false, message: "Server error while updating patient" });
  }
});

/**
 * @route   DELETE /api/patients/:id
 * @desc    Soft delete a patient (mark as deleted)
 * @access  Private (BloodBank only)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "bloodbank" && req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const patient = await Patient.findOne({
      _id: req.params.id,
      bloodBankId: req.user._id,
      isDeleted: false
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found or not authorized" });
    }

    patient.isDeleted = true;
    await patient.save();

    res.status(200).json({ success: true, message: "Patient deleted successfully" });
  } catch (err) {
    console.error("Delete Patient Error:", err);
    res.status(500).json({ success: false, message: "Server error while deleting patient" });
  }
});

/**
 * @route   POST /api/patients/:id/restore
 * @desc    Restore a soft deleted patient
 * @access  Private (BloodBank only)
 */
router.post("/:id/restore", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "bloodbank" && req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const patient = await Patient.findOne({
      _id: req.params.id,
      bloodBankId: req.user._id,
      isDeleted: true
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found or not authorized" });
    }

    patient.isDeleted = false;
    await patient.save();

    res.status(200).json({ success: true, message: "Patient restored successfully", patient });
  } catch (err) {
    console.error("Restore Patient Error:", err);
    res.status(500).json({ success: false, message: "Server error while restoring patient" });
  }
});

/**
 * @route   GET /api/patients/deleted
 * @desc    Get all soft deleted patients for the logged-in blood bank
 * @access  Private (BloodBank only)
 */
router.get("/deleted", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "bloodbank" && req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const patients = await Patient.find({
      bloodBankId: req.user._id,
      isDeleted: true
    }).populate('bloodBankId', 'name');
    res.status(200).json({ success: true, data: patients });
  } catch (err) {
    console.error("Fetch Deleted Patients Error:", err);
    res.status(500).json({ success: false, message: "Server error while fetching deleted patients" });
  }
});

module.exports = router;
