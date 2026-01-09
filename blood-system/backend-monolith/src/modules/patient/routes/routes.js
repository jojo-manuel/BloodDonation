const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const verifyToken = require('../../../middleware/auth');

// GET /api/patients - Get all patients for the logged-in blood bank
router.get('/', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const patients = await Patient.find({ hospital_id }).sort({ createdAt: -1 });
        res.json({ success: true, data: patients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/patients/search - Search patients (e.g., by MRID)
router.get('/search', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const { mrid } = req.query;

        let query = { hospital_id };
        if (mrid) {
            // Case-insensitive regex match for MRID
            query.mrid = { $regex: mrid, $options: 'i' };
        }

        const patients = await Patient.find(query);
        res.json({ success: true, data: patients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/patients - Create a new patient
router.post('/', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const patientData = { ...req.body, hospital_id };

        const patient = new Patient(patientData);
        await patient.save();

        res.status(201).json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/patients/:id - Update a patient
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const { id } = req.params;

        const patient = await Patient.findOneAndUpdate(
            { _id: id, hospital_id },
            req.body,
            { new: true }
        );

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/patients/:id - Delete a patient
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const { id } = req.params;

        const patient = await Patient.findOneAndDelete({ _id: id, hospital_id });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.json({ success: true, message: 'Patient deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
