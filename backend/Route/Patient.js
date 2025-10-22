const express = require("express");
const Patient = require("../Models/Patient");

const router = express.Router();


// ✅ CREATE Patient
router.post("/", async (req, res) => {
  try {
    const { name, address, bloodGroup, mrid, unitsRequired, dateNeeded, bloodBankId, bloodBankName } = req.body;

    if (!name || !address || !bloodGroup || !mrid || !unitsRequired || !dateNeeded || !bloodBankId || !bloodBankName) {
      return res.status(400).json({ message: "All fields are required including bloodBankId and bloodBankName" });
    }

    const existing = await Patient.findOne({ mrid });
    if (existing) {
      return res.status(400).json({ message: "Patient with this MRID already exists" });
    }

    const patient = new Patient({
      name,
      address,
      bloodGroup,
      mrid,
      unitsRequired,
      dateNeeded,
      bloodBankId,
      bloodBankName,
    });

    await patient.save();
    res.status(201).json({ message: "Patient added successfully", patient });

  } catch (error) {
    console.error("Error creating patient:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


// ✅ READ All Patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.status(200).json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ✅ READ Single Patient
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.status(200).json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ✅ UPDATE Patient
router.put("/:id", async (req, res) => {
  try {
    const { name, address, bloodGroup, unitsRequired, dateNeeded, bloodBankId, bloodBankName } = req.body;

    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    patient.name = name || patient.name;
    patient.address = address || patient.address;
    patient.bloodGroup = bloodGroup || patient.bloodGroup;
    patient.unitsRequired = unitsRequired || patient.unitsRequired;
    patient.dateNeeded = dateNeeded || patient.dateNeeded;
    patient.bloodBankId = bloodBankId || patient.bloodBankId;
    patient.bloodBankName = bloodBankName || patient.bloodBankName;

    await patient.save();
    res.status(200).json({ message: "Patient updated successfully", patient });
  } catch (error) {
    console.error("Error updating patient:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ✅ DELETE Patient
router.delete("/:id", async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
