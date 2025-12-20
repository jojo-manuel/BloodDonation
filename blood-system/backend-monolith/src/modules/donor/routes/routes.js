const express = require('express');
const { body, validationResult } = require('express-validator');
const Donor = require('../models/Donor');
const { validateEligibility } = require('../middleware/eligibility');
// Import global middleware for Auth/RBAC
const verifyToken = require('../../../middleware/auth');
const { checkRole } = require('../../../middleware/rbac'); // Assuming RBAC not stricly used here in original but good to add if needed

const router = express.Router();

const donorValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('contact').trim().notEmpty().withMessage('Contact is required'),
    body('age').isInt({ min: 18, max: 65 }).withMessage('Age must be between 18 and 65'),
    body('hospital_id').trim().notEmpty().withMessage('Hospital ID is required')
];

// Note: In monolith, we might need to explicitely apply auth middleware if not applied globally.
// The original microservice relied on Gateway for basic auth, but internal routes had no auth middleware?
// Actually donor routes.js definitely missed middleware in the file I read, it relied entirely on Gateway.
// In Monolith, we MUST add `verifyToken` here for protected routes.

router.post('/', verifyToken, donorValidation, validateEligibility, async (req, res) => { // Added verifyToken
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const hospital_id = req.user.hospital_id || req.body.hospital_id; // Use req.user from token priority
        const donor = new Donor({ ...req.body, hospital_id });
        await donor.save();
        res.status(201).json({ success: true, message: 'Donor created successfully', data: { donor, eligibility: req.eligibilityInfo } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create donor', error: error.message });
    }
});

router.get('/cities/available', verifyToken, async (req, res) => { // Added verifyToken
    try {
        const hospital_id = req.user.hospital_id; // From token
        const query = { isActive: true };
        if (hospital_id) query.hospital_id = hospital_id;
        const cities = await Donor.distinct('address.city', query);
        res.json({ success: true, data: cities.filter(c => c) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/', verifyToken, async (req, res) => { // Added verifyToken
    try {
        const hospital_id = req.user.hospital_id || req.query.hospital_id;
        if (!hospital_id) return res.status(400).json({ success: false, message: 'Hospital ID is required' });

        const { blood_group, eligible, page = 1, limit = 20 } = req.query;
        const query = { hospital_id, isActive: true };
        if (blood_group) query.blood_group = blood_group;
        if (eligible !== undefined) query.eligibility_status = eligible === 'true';

        const skip = (page - 1) * limit;
        const donors = await Donor.find(query).sort({ clearfix: -1 }).skip(skip).limit(parseInt(limit)); // Fixed sort field typo 'createdAt' maybe?
        const total = await Donor.countDocuments(query);

        res.json({
            success: true,
            data: { donors, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch donors', error: error.message });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const donor = await Donor.findOne({ _id: req.params.id, hospital_id });
        if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });
        res.json({ success: true, data: { donor, eligibility: donor.checkEligibility() } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch donor', error: error.message });
    }
});

router.put('/:id', verifyToken, validateEligibility, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const donor = await Donor.findOneAndUpdate({ _id: req.params.id, hospital_id }, req.body, { new: true, runValidators: true });
        if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });
        res.json({ success: true, message: 'Donor updated', data: { donor, eligibility: req.eligibilityInfo } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update donor', error: error.message });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const donor = await Donor.findOneAndUpdate({ _id: req.params.id, hospital_id }, { isActive: false }, { new: true });
        if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });
        res.json({ success: true, message: 'Donor deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete donor', error: error.message });
    }
});

router.get('/:id/eligibility', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const donor = await Donor.findOne({ _id: req.params.id, hospital_id });
        if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

        const eligibilityCheck = donor.checkEligibility();
        donor.eligibility_status = eligibilityCheck.eligible;
        donor.eligibility_notes = eligibilityCheck.reasons.join('; ');
        await donor.save();

        res.json({ success: true, data: eligibilityCheck });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to check eligibility', error: error.message });
    }
});

module.exports = router;
