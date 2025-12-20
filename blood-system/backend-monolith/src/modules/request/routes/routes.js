const express = require('express');
const { body, validationResult } = require('express-validator');
const Request = require('../models/Request');
// Cross-module import
const BloodUnit = require('../../inventory/models/BloodUnit');
const verifyToken = require('../../../middleware/auth');

const router = express.Router();

const requestValidation = [
    body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('urgency').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level'),
    body('hospital_id').trim().notEmpty().withMessage('Hospital ID is required')
];

router.post('/', verifyToken, requestValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const hospital_id = req.user.hospital_id || req.body.hospital_id;
        const requester_id = req.user.user_id;

        // Check availability using direct model call (Monolith advantage)
        const availability = await BloodUnit.getAvailability(hospital_id, req.body.blood_group);

        // availability matches array from aggregation
        const availableQuantity = availability.find(
            item => item._id === req.body.blood_group
        )?.total_quantity || 0;

        const request = new Request({
            ...req.body,
            hospital_id,
            requester_id,
            notes: availableQuantity < req.body.quantity
                ? `Requested ${req.body.quantity} units, but only ${availableQuantity} available. ${req.body.notes || ''}`
                : req.body.notes
        });

        await request.save();

        res.status(201).json({
            success: true,
            message: 'Blood request created successfully',
            data: {
                request,
                availability: {
                    available: availableQuantity,
                    requested: req.body.quantity,
                    sufficient: availableQuantity >= req.body.quantity
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create request', error: error.message });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id || req.query.hospital_id;
        const user_id = req.user.user_id;
        const user_role = req.user.role;

        if (!hospital_id && user_role !== 'DONOR' && !user_id) return res.status(400).json({ success: false, message: 'Hospital ID required' });

        const { status, urgency, page = 1, limit = 20 } = req.query;
        const query = {};
        if (hospital_id) query.hospital_id = hospital_id;
        if (user_role === 'DONOR' || user_role === 'USER') query.requester_id = user_id;
        if (status) query.status = status;
        if (urgency) query.urgency = urgency;

        const skip = (page - 1) * limit;
        const requests = await Request.find(query).sort({ urgency: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Request.countDocuments(query);

        res.json({
            success: true,
            data: { requests, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch requests', error: error.message });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const user_id = req.user.user_id;
        const user_role = req.user.role;
        const query = { _id: req.params.id, hospital_id };
        if (user_role === 'DONOR') query.requester_id = user_id;

        const request = await Request.findOne(query);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch request', error: error.message });
    }
});

router.put('/:id/approve', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'BLOODBANK_ADMIN') return res.status(403).json({ success: false, message: 'Admin only' });
        const hospital_id = req.user.hospital_id;

        const request = await Request.findOne({ _id: req.params.id, hospital_id, status: 'pending' });
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        const availability = await BloodUnit.getAvailability(hospital_id, request.blood_group);
        const availableQuantity = availability.find(item => item._id === request.blood_group)?.total_quantity || 0;

        if (availableQuantity < request.quantity) {
            return res.status(400).json({ success: false, message: `Insufficient blood units. Available: ${availableQuantity}` });
        }

        request.status = 'approved';
        request.approved_by = req.user.user_id;
        request.approved_at = new Date();
        await request.save();
        res.json({ success: true, message: 'Request approved', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to approve request', error: error.message });
    }
});

router.put('/:id/reject', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'BLOODBANK_ADMIN') return res.status(403).json({ success: false, message: 'Admin only' });
        const request = await Request.findOne({ _id: req.params.id, hospital_id: req.user.hospital_id, status: 'pending' });
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        request.status = 'rejected';
        request.rejected_reason = req.body.reason || 'Not specified';
        await request.save();
        res.json({ success: true, message: 'Request rejected', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reject request', error: error.message });
    }
});

router.put('/:id/fulfill', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'BLOODBANK_ADMIN') return res.status(403).json({ success: false, message: 'Admin only' });
        const request = await Request.findOne({ _id: req.params.id, hospital_id: req.user.hospital_id, status: 'approved' });
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        request.status = 'fulfilled';
        request.fulfilled_at = new Date();
        await request.save();
        res.json({ success: true, message: 'Request fulfilled', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fulfill request', error: error.message });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const query = { _id: req.params.id, hospital_id: req.user.hospital_id, status: 'pending' };
        if (req.user.role === 'DONOR') query.requester_id = req.user.user_id;

        const request = await Request.findOneAndUpdate(query, { status: 'cancelled' }, { new: true });
        if (!request) return res.status(404).json({ success: false, message: 'Request not found or cannot be cancelled' });
        res.json({ success: true, message: 'Request cancelled', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel request', error: error.message });
    }
});

module.exports = router;
