const express = require('express');
const { body, validationResult } = require('express-validator');
const BloodUnit = require('../models/BloodUnit');
const verifyToken = require('../../../middleware/auth'); // Import global middleware

const router = express.Router();

const bloodUnitValidation = [
    body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
    body('hospital_id').trim().notEmpty().withMessage('Hospital ID is required')
];

router.post('/', verifyToken, bloodUnitValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const hospital_id = req.user.hospital_id || req.body.hospital_id; // Priority to token
        const bloodUnit = new BloodUnit({ ...req.body, hospital_id });
        await bloodUnit.save();
        res.status(201).json({ success: true, message: 'Blood unit added', data: bloodUnit });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add blood unit', error: error.message });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id || req.query.hospital_id;
        if (!hospital_id) return res.status(400).json({ success: false, message: 'Hospital ID is required' });

        const { blood_group, status, page = 1, limit = 20 } = req.query;
        const query = { hospital_id };
        if (blood_group) query.blood_group = blood_group;
        query.status = status || 'available';

        const skip = (page - 1) * limit;
        const bloodUnits = await BloodUnit.find(query).sort({ expiry_date: 1 }).skip(skip).limit(parseInt(limit));
        const total = await BloodUnit.countDocuments(query);

        const unitsWithWarnings = bloodUnits.map(unit => ({
            ...unit.toObject(),
            is_expired: unit.isExpired(),
            is_expiring_soon: unit.isExpiringSoon()
        }));

        res.json({ success: true, data: { blood_units: unitsWithWarnings, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch inventory', error: error.message });
    }
});

router.get('/availability', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id || req.query.hospital_id;
        if (!hospital_id) return res.status(400).json({ success: false, message: 'Hospital ID is required' });
        const { blood_group } = req.query;
        const availability = await BloodUnit.getAvailability(hospital_id, blood_group);
        res.json({ success: true, data: { hospital_id, availability, timestamp: new Date().toISOString() } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to check availability', error: error.message });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const bloodUnit = await BloodUnit.findOne({ _id: req.params.id, hospital_id });
        if (!bloodUnit) return res.status(404).json({ success: false, message: 'Blood unit not found' });
        res.json({ success: true, data: { ...bloodUnit.toObject(), is_expired: bloodUnit.isExpired(), is_expiring_soon: bloodUnit.isExpiringSoon() } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch blood unit', error: error.message });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const userRole = req.user.role;
        if (userRole !== 'BLOODBANK_ADMIN') return res.status(403).json({ success: false, message: 'Only admins can update inventory' });

        const bloodUnit = await BloodUnit.findOneAndUpdate({ _id: req.params.id, hospital_id }, req.body, { new: true, runValidators: true });
        if (!bloodUnit) return res.status(404).json({ success: false, message: 'Blood unit not found' });
        res.json({ success: true, message: 'Blood unit updated', data: bloodUnit });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update blood unit', error: error.message });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const userRole = req.user.role;
        if (userRole !== 'BLOODBANK_ADMIN') return res.status(403).json({ success: false, message: 'Only admins can delete inventory' });

        const bloodUnit = await BloodUnit.findOneAndDelete({ _id: req.params.id, hospital_id });
        if (!bloodUnit) return res.status(404).json({ success: false, message: 'Blood unit not found' });
        res.json({ success: true, message: 'Blood unit deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete blood unit', error: error.message });
    }
});

router.put('/:id/reserve', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const bloodUnit = await BloodUnit.findOne({ _id: req.params.id, hospital_id, status: 'available' });
        if (!bloodUnit) return res.status(404).json({ success: false, message: 'Blood unit not found or not available' });
        if (bloodUnit.isExpired()) return res.status(400).json({ success: false, message: 'Blood unit is expired' });

        bloodUnit.status = 'reserved';
        await bloodUnit.save();
        res.json({ success: true, message: 'Blood unit reserved', data: bloodUnit });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reserve blood unit', error: error.message });
    }
});

router.get('/expiring/soon', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const days = parseInt(req.query.days) || 7;
        const expiryThreshold = new Date();
        expiryThreshold.setDate(expiryThreshold.getDate() + days);

        const expiringUnits = await BloodUnit.find({
            hospital_id,
            status: 'available',
            expiry_date: { $gt: new Date(), $lte: expiryThreshold }
        }).sort({ expiry_date: 1 });

        res.json({ success: true, data: { expiring_units: expiringUnits, count: expiringUnits.length, threshold_days: days } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch expiring units', error: error.message });
    }
});

module.exports = router;
