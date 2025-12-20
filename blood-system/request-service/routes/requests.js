const express = require('express');
const { body, validationResult } = require('express-validator');
const Request = require('../models/Request');
const { checkAvailability, getAvailableUnits } = require('../services/inventoryClient');

const router = express.Router();

// ==========================================
// VALIDATION RULES
// ==========================================

const requestValidation = [
    body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('urgency').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level'),
    body('hospital_id').trim().notEmpty().withMessage('Hospital ID is required')
];

// ==========================================
// ROUTES
// ==========================================

/**
 * POST /requests
 * Create a new blood request
 * Access: DONOR, DOCTOR, BLOODBANK_ADMIN
 */
router.post('/', requestValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const hospital_id = req.headers['x-hospital-id'] || req.body.hospital_id;
        const requester_id = req.headers['x-user-id'];

        // Check availability before creating request
        const availability = await checkAvailability(hospital_id, req.body.blood_group);

        const availableQuantity = availability.data.availability.find(
            item => item._id === req.body.blood_group
        )?.total_quantity || 0;

        const request = new Request({
            ...req.body,
            hospital_id,
            requester_id,
            notes: availableQuantity < req.body.quantity
                ? `Requested ${req.body.quantity} units, but only ${availableQuantity} available`
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
        console.error('Create request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create request',
            error: error.message
        });
    }
});

/**
 * GET /requests
 * List all requests (filtered by hospital_id and optionally by requester)
 * Access: DONOR (own requests), DOCTOR (all), BLOODBANK_ADMIN (all)
 */
router.get('/', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'] || req.query.hospital_id;
        const user_id = req.headers['x-user-id'];
        const user_role = req.headers['x-user-role'];

        if (!hospital_id && user_role !== 'DONOR' && !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Hospital ID is required'
            });
        }

        const { status, urgency, page = 1, limit = 20 } = req.query;

        // Build query
        const query = {};

        if (hospital_id) {
            query.hospital_id = hospital_id;
        }

        // Donors/Users can only see their own requests
        if (user_role === 'DONOR' || user_role === 'USER') {
            query.requester_id = user_id;
        }

        if (status) {
            query.status = status;
        }

        if (urgency) {
            query.urgency = urgency;
        }

        // Pagination
        const skip = (page - 1) * limit;

        const requests = await Request.find(query)
            .sort({ urgency: -1, createdAt: -1 }) // Critical first, then by date
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Request.countDocuments(query);

        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('List requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch requests',
            error: error.message
        });
    }
});

/**
 * GET /requests/:id
 * Get request by ID
 * Access: DONOR (own), DOCTOR, BLOODBANK_ADMIN
 */
router.get('/:id', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const user_id = req.headers['x-user-id'];
        const user_role = req.headers['x-user-role'];

        const query = {
            _id: req.params.id,
            hospital_id
        };

        // Donors can only see their own requests
        if (user_role === 'DONOR') {
            query.requester_id = user_id;
        }

        const request = await Request.findOne(query);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        res.json({
            success: true,
            data: request
        });

    } catch (error) {
        console.error('Get request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch request',
            error: error.message
        });
    }
});

/**
 * PUT /requests/:id/approve
 * Approve a blood request
 * Access: BLOODBANK_ADMIN only
 */
router.put('/:id/approve', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const user_id = req.headers['x-user-id'];
        const user_role = req.headers['x-user-role'];

        // Only admin can approve
        if (user_role !== 'BLOODBANK_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can approve requests'
            });
        }

        const request = await Request.findOne({
            _id: req.params.id,
            hospital_id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        // Check availability
        const availability = await checkAvailability(hospital_id, request.blood_group);
        const availableQuantity = availability.data.availability.find(
            item => item._id === request.blood_group
        )?.total_quantity || 0;

        if (availableQuantity < request.quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient blood units. Available: ${availableQuantity}, Requested: ${request.quantity}`
            });
        }

        // Update request status
        request.status = 'approved';
        request.approved_by = user_id;
        request.approved_at = new Date();
        await request.save();

        res.json({
            success: true,
            message: 'Request approved successfully',
            data: request
        });

    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve request',
            error: error.message
        });
    }
});

/**
 * PUT /requests/:id/reject
 * Reject a blood request
 * Access: BLOODBANK_ADMIN only
 */
router.put('/:id/reject', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const user_id = req.headers['x-user-id'];
        const user_role = req.headers['x-user-role'];

        // Only admin can reject
        if (user_role !== 'BLOODBANK_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can reject requests'
            });
        }

        const { reason } = req.body;

        const request = await Request.findOne({
            _id: req.params.id,
            hospital_id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        request.status = 'rejected';
        request.rejected_reason = reason || 'Not specified';
        await request.save();

        res.json({
            success: true,
            message: 'Request rejected successfully',
            data: request
        });

    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject request',
            error: error.message
        });
    }
});

/**
 * PUT /requests/:id/fulfill
 * Mark request as fulfilled
 * Access: BLOODBANK_ADMIN only
 */
router.put('/:id/fulfill', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const user_role = req.headers['x-user-role'];

        // Only admin can fulfill
        if (user_role !== 'BLOODBANK_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can fulfill requests'
            });
        }

        const request = await Request.findOne({
            _id: req.params.id,
            hospital_id,
            status: 'approved'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or not approved'
            });
        }

        request.status = 'fulfilled';
        request.fulfilled_at = new Date();
        await request.save();

        res.json({
            success: true,
            message: 'Request fulfilled successfully',
            data: request
        });

    } catch (error) {
        console.error('Fulfill request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fulfill request',
            error: error.message
        });
    }
});

/**
 * DELETE /requests/:id
 * Cancel a request (soft delete)
 * Access: Requester (own) or BLOODBANK_ADMIN
 */
router.delete('/:id', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const user_id = req.headers['x-user-id'];
        const user_role = req.headers['x-user-role'];

        const query = {
            _id: req.params.id,
            hospital_id,
            status: 'pending' // Can only cancel pending requests
        };

        // Donors can only cancel their own requests
        if (user_role === 'DONOR') {
            query.requester_id = user_id;
        }

        const request = await Request.findOneAndUpdate(
            query,
            { status: 'cancelled' },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or cannot be cancelled'
            });
        }

        res.json({
            success: true,
            message: 'Request cancelled successfully',
            data: request
        });

    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel request',
            error: error.message
        });
    }
});

module.exports = router;
