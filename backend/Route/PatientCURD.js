// routes/patient.js
const express = require("express");
const Patient = require("../Models/Patient");
const DonationRequest = require("../Models/DonationRequest");
const authMiddleware = require("../Middleware/authMiddleware");

const router = express.Router();

/**
 * @route   POST /api/patients
 * @desc    Add a new patient (bloodbank and admin can add)
 * @access  Private (BloodBank and Admin)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { patientName, address, bloodGroup, mrid, phoneNumber, requiredUnits, requiredDate, bloodBankId, bloodBankName } = req.body;

    // Role check
    if (req.user.role !== "bloodbank" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Only blood banks and admins can add patients." });
    }

    // Validation
    if (!patientName || !bloodGroup || !mrid || !phoneNumber || !requiredUnits || !requiredDate) {
      return res.status(400).json({ success: false, message: "Patient name, blood group, MRID, phone number, required units, and required date are required" });
    }

    // Validate address structure
    if (!address || !address.pincode) {
      return res.status(400).json({ success: false, message: "Address with pincode is required" });
    }

    // Fetch address details from pincode
    let addressData = { ...address };
    try {
      const axios = require('axios');
      const response = await axios.get(`https://api.postalpincode.in/pincode/${address.pincode}`);

      if (response.data && response.data[0] && response.data[0].Status === 'Success') {
        const postOffices = response.data[0].PostOffice;
        if (postOffices && postOffices.length > 0) {
          const postOffice = postOffices[0];
          addressData = {
            ...addressData,
            district: postOffice.District || addressData.district,
            city: postOffice.Block || postOffice.Division || addressData.city,
            localBody: postOffice.Name || addressData.localBody,
            state: postOffice.State || addressData.state
          };
        }
      }
    } catch (error) {
      console.error('Error fetching address from pincode:', error);
      // Continue with provided address data if API fails
    }

    // Determine blood bank ID and name
    let finalBloodBankId = req.user._id;
    let finalBloodBankName = bloodBankName;
    if (req.user.role === "admin" && bloodBankId) {
      finalBloodBankId = bloodBankId;
      // If admin provides bloodBankId, fetch the name if not provided
      if (!finalBloodBankName) {
        const BloodBank = require("../Models/BloodBank");
        const bloodBank = await BloodBank.findById(finalBloodBankId);
        if (!bloodBank) {
          return res.status(400).json({ success: false, message: "Invalid blood bank ID" });
        }
        finalBloodBankName = bloodBank.name;
      }
    } else if (req.user.role === "bloodbank") {
      // For blood bank users, fetch their name
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: req.user._id });
      if (!bloodBank) {
        return res.status(400).json({ success: false, message: "Blood bank not found" });
      }
      finalBloodBankName = bloodBank.name;
    }

    // Create patient with address data from pincode API
    const patient = new Patient({
      bloodBankId: finalBloodBankId,
      bloodBankName: finalBloodBankName,
      name: patientName,
      address: addressData,
      bloodGroup,
      mrid: mrid,
      phoneNumber: phoneNumber,
      unitsRequired: requiredUnits,
      dateNeeded: requiredDate,
    });

    await patient.save();
    res.status(201).json({ success: true, message: "Patient added successfully", patient });
  } catch (err) {
    console.error("Patient Add Error:", err);
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.encryptedMrid) {
        return res.status(400).json({ 
          success: false, 
          message: "Database index error. Please contact administrator to fix encryptedMrid index issue." 
        });
      }
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

    // Determine blood bank ID
    let bloodBankId = req.user._id;
    if (req.user.role === "bloodbank") {
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: req.user._id });
      if (!bloodBank) {
        return res.status(400).json({ success: false, message: "Blood bank not found" });
      }
      bloodBankId = bloodBank._id;
    }

    const patients = await Patient.find({ bloodBankId }).populate('bloodBankId', 'name');

    // Get patient IDs
    const patientIds = patients.map(p => p._id);

    // Fetch donation requests for these patients
    const donationRequests = await DonationRequest.find({
      patientId: { $in: patientIds },
      status: { $ne: 'rejected' }
    })
    .populate('donorId', 'userId')
    .populate('donorId.userId', 'name username')
    .populate('bloodBankId', 'name')
    .sort({ createdAt: -1 });

    // Attach donation requests to patients
    const patientsWithRequests = patients.map(patient => {
      const requests = donationRequests.filter(r => r.patientId.toString() === patient._id.toString());
      return {
        ...patient.toObject(),
        donationRequests: requests.map(r => ({
          _id: r._id,
          donorName: r.donorId?.userId?.name || r.donorId?.userId?.username || 'Unknown',
          bloodBankName: r.bloodBankId?.name || 'Unknown',
          status: r.status,
          requestedDate: r.requestedDate,
          requestedTime: r.requestedTime,
          createdAt: r.createdAt
        }))
      };
    });

    res.status(200).json({ success: true, data: patientsWithRequests });
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

    const { patientName, address, bloodGroup, phoneNumber, requiredUnits, requiredDate } = req.body;

    // Determine blood bank ID for update
    let bloodBankId = req.user._id;
    if (req.user.role === "bloodbank") {
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: req.user._id });
      if (!bloodBank) {
        return res.status(400).json({ success: false, message: "Blood bank not found" });
      }
      bloodBankId = bloodBank._id;
    }

    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: req.params.id, bloodBankId }, // Ensure only the user who added can edit
      {
        name: patientName,
        address,
        bloodGroup,
        phoneNumber,
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

    // Determine blood bank ID for delete
    let bloodBankId = req.user._id;
    if (req.user.role === "bloodbank") {
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: req.user._id });
      if (!bloodBank) {
        return res.status(400).json({ success: false, message: "Blood bank not found" });
      }
      bloodBankId = bloodBank._id;
    }

    const deletedPatient = await Patient.findOneAndDelete({
      _id: req.params.id,
      bloodBankId,
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
