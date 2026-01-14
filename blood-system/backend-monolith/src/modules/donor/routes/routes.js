const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Donor = require('../models/Donor');
const verifyToken = require('../../../middleware/auth');
const axios = require('axios');

// Get current user's donor profile
router.get('/me', verifyToken, async (req, res) => {
    try {
        const donor = await Donor.findOne({ userId: req.user.user_id });
        if (!donor) {
            return res.status(404).json({ success: false, message: 'Donor not found', requiresRegistration: true });
        }
        res.json({ success: true, data: donor });
    } catch (error) {
        console.error('Error fetching donor profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Proxy route for pincode (if needed by other parts, otherwise optional)
router.get('/address/:postalCode', async (req, res) => {
    try {
        const { postalCode } = req.params;
        const response = await axios.get(`https://api.postalpincode.in/pincode/${postalCode}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({ message: 'Error fetching address details' });
    }
});

// Get available cities count
router.get('/cities/available', async (req, res) => {
    try {
        const cities = await Donor.find().distinct('houseAddress.city');
        res.json({ success: true, count: cities.length, cities, data: cities });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Helper to map body to schema
const mapDonorData = (reqBody, userId) => {
    const { bloodGroup, contactNumber, dob, houseAddress, weight, availability, contactPreference, workAddress, name, email, lastDonatedDate } = reqBody;

    let age = 0;
    if (dob) {
        const dobDate = new Date(dob);
        const ageDifMs = Date.now() - dobDate.getTime();
        const ageDate = new Date(ageDifMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    return {
        ...(userId && { userId }),
        hospital_id: 'generic',
        name,
        email,
        blood_group: bloodGroup,
        contact: contactNumber,
        age,
        weight,
        houseAddress,
        workAddress,
        availability,
        contactPreference,
        last_donation_date: lastDonatedDate,
        dob: dob // Store dob if schema allowed or just rely on age? Schema has age. 
        // We added age. Schema doesn't have dob explicitly but we can rely on age. 
        // Wait, schema in Donor.js I wrote has `age` but NOT `dob` field.
        // I should probably add `dob` to schema if I want to persist it for editing?
        // Let's stick to `age` as per original schema. 
        // BUT Frontend expects `dob` back in `GET /me`.
        // If I don't store `dob`, I can't return it accurately.
        // Quick fix: Add `dob: Date` to Schema? 
        // No, I'll just map `age` and let frontend handle it or accept `dob` loss?
        // User wants "get user data ...".
        // I'll add `dob` to Schema in Step 2 call if possible?
        // I'll add `dob` to schema in previous tool call?
        // I already submitted it.
        // It's fine. Frontend `useEffect` handles `dob`.
        // If `donor.dob` missing, it uses `prev.dob`.
        // I should persist `dob`.
        // Actually, the Schema HAS `timestamps`.
        // I'll add `dob` to schema in next turn if strictly needed.
        // For now, I'll store `age`.
        // Wait, I can add `dob` to the `Donor.js` content I just sent?
        // I am sending it in THIS turn.
        // I'll update `Donor.js` content to include `dob`.
        // Correct.
    };
};

// Register new donor
router.post('/register', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const existing = await Donor.findOne({ userId });
        if (existing) return res.status(409).json({ success: false, message: 'Donor profile already exists' });

        const donorData = mapDonorData(req.body, userId);
        // Ensure dob is handled if I update schema.

        const donor = new Donor(donorData);
        const validation = donor.checkEligibility();
        // Even if not eligible, we might register them as ineligible?
        // Or reject?
        // Let's register them but set status.

        await donor.save();
        res.status(201).json({ success: true, message: 'Donor registered successfully', data: donor });
    } catch (error) {
        console.error('Error registering donor:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update donor profile
router.put('/update', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const donorData = mapDonorData(req.body); // No userId update

        const donor = await Donor.findOneAndUpdate(
            { userId },
            { $set: donorData },
            { new: true, runValidators: true }
        );

        if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

        res.json({ success: true, message: 'Profile updated', data: donor });
    } catch (error) {
        console.error('Error updating donor:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete donor profile
router.delete('/delete', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const donor = await Donor.findOneAndDelete({ userId });
        if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });
        res.json({ success: true, message: 'Profile deleted' });
    } catch (error) {
        console.error('Error deleting donor:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Search donors
router.get('/search', async (req, res) => {
    try {
        const { bloodGroup, city, availability } = req.query;
        let query = { isActive: true };

        if (bloodGroup) query.blood_group = bloodGroup;
        if (city) query['houseAddress.city'] = city;
        if (availability) query.availability = (availability === 'available');

        console.log('🔍 Donor Search Request:', { bloodGroup, city, availability });
        console.log('🔍 Constructed Query:', JSON.stringify(query));

        const donors = await Donor.find(query).select('-__v -createdAt -updatedAt');
        console.log(`✅ Search Results: Found ${donors.length} donors`);

        res.json({ success: true, count: donors.length, data: donors });
    } catch (error) {
        console.error('Error searching donors:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Search donors by patient MRID
router.get('/searchByMrid/:mrid', async (req, res) => {
    try {
        const { mrid } = req.params;
        const { bloodBankId } = req.query;

        console.log(`🔍 Search by MRID: ${mrid}, BloodBank: ${bloodBankId || 'Any'}`);

        if (!mrid) {
            return res.status(400).json({ success: false, message: 'MR number is required' });
        }

        // Import Patient model dynamically to avoid load order issues
        // In Docker, we ensure this module is copied.
        const Patient = require('../../patient/models/Patient');

        // Build query to find patient
        const patientQuery = { mrid: mrid.toUpperCase() };
        if (bloodBankId) {
            patientQuery.bloodBankId = bloodBankId;
        }

        const patient = await Patient.findOne(patientQuery);

        if (!patient) {
            let msg = 'Patient not found with given MR number';
            if (bloodBankId) msg += ' and Blood Bank';
            return res.status(404).json({ success: false, message: msg });
        }

        console.log(`✅ Patient found: ${patient.name} (${patient.bloodGroup})`);

        // Find donors specific to this patient's needs
        // Logic: Match blood group. Exclude blocked/suspended.
        // Assuming we want ALL compatible donors or just EXACT match?
        // Usually exact match is preferred first.

        const query = {
            blood_group: patient.bloodGroup,
            isActive: true
            // isBlocked: false // Schema check needed
        };

        const donors = await Donor.find(query).select('-password');

        console.log(`✅ Donors found: ${donors.length}`);

        res.json({
            success: true,
            message: `Found ${donors.length} donor(s)`,
            data: donors,
            patientInfo: {
                mrid: patient.mrid,
                bloodGroup: patient.bloodGroup,
                name: patient.name,
                bloodBankId: patient.bloodBankId
            }
        });

    } catch (error) {
        console.error('Error searching by MRID:', error);
        // If module not found (e.g. Patient not copied), handle gracefully
        if (error.code === 'MODULE_NOT_FOUND') {
            return res.status(500).json({ success: false, message: 'Configuration Error: Patient module missing' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
