const express = require('express');
const { body, validationResult } = require('express-validator');
const BloodUnit = require('../models/BloodUnit');

const router = express.Router();

// ==========================================
// VALIDATION RULES
// ==========================================

const bloodUnitValidation = [
    body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
    body('hospital_id').trim().notEmpty().withMessage('Hospital ID is required')
];

// ==========================================
// ROUTES
// ==========================================

/**
 * POST /inventory
 * Add blood units to inventory
 * Access: BLOODBANK_ADMIN
 */
router.post('/', bloodUnitValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const hospital_id = req.headers['x-hospital-id'] || req.body.hospital_id;

        const bloodUnit = new BloodUnit({
            ...req.body,
            hospital_id
        });

        await bloodUnit.save();

        res.status(201).json({
            success: true,
            message: 'Blood unit added successfully',
            data: bloodUnit
        });

    } catch (error) {
        console.error('Add blood unit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add blood unit',
            error: error.message
        });
    }
});

/**
 * GET /inventory
 * List all blood units (filtered by hospital_id)
 * Access: BLOODBANK_ADMIN, DOCTOR
 */
router.get('/', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'] || req.query.hospital_id;

        if (!hospital_id) {
            return res.status(400).json({
                success: false,
                message: 'Hospital ID is required'
            });
        }

        const { blood_group, status, page = 1, limit = 20 } = req.query;

        // Build query
        const query = { hospital_id };

        if (blood_group) {
            query.blood_group = blood_group;
        }

        if (status) {
            query.status = status;
        } else {
            // Default to available units
            query.status = 'available';
        }

        // Pagination
        const skip = (page - 1) * limit;

        const bloodUnits = await BloodUnit.find(query)
            .sort({ expiry_date: 1 }) // Sort by expiry date (FIFO)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await BloodUnit.countDocuments(query);

        // Mark expiring soon units
        const unitsWithWarnings = bloodUnits.map(unit => ({
            ...unit.toObject(),
            is_expired: unit.isExpired(),
            is_expiring_soon: unit.isExpiringSoon()
        }));

        res.json({
            success: true,
            data: {
                blood_units: unitsWithWarnings,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('List inventory error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory',
            error: error.message
        });
    }
});

/**
 * GET /inventory/availability
 * Get blood availability by blood group
 * Access: BLOODBANK_ADMIN, DOCTOR
 */
router.get('/availability', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'] || req.query.hospital_id;

        if (!hospital_id) {
            return res.status(400).json({
                success: false,
                message: 'Hospital ID is required'
            });
        }

        const { blood_group } = req.query;

        const availability = await BloodUnit.getAvailability(hospital_id, blood_group);

        res.json({
            success: true,
            data: {
                hospital_id,
                availability,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check availability',
            error: error.message
        });
    }
});

/**
 * GET /inventory/:id
 * Get blood unit by ID
 * Access: BLOODBANK_ADMIN, DOCTOR
 */
router.get('/:id', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const bloodUnit = await BloodUnit.findOne({
            _id: req.params.id,
            hospital_id
        });

        if (!bloodUnit) {
            return res.status(404).json({
                success: false,
                message: 'Blood unit not found'
            });
        }

        res.json({
            success: true,
            data: {
                ...bloodUnit.toObject(),
                is_expired: bloodUnit.isExpired(),
                is_expiring_soon: bloodUnit.isExpiringSoon()
            }
        });

    } catch (error) {
        console.error('Get blood unit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blood unit',
            error: error.message
        });
    }
});

/**
 * PUT /inventory/:id
 * Update blood unit
 * Access: BLOODBANK_ADMIN
 */
router.put('/:id', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const userRole = req.headers['x-user-role'];

        // Only admin can update
        if (userRole !== 'BLOODBANK_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update inventory'
            });
        }

        const bloodUnit = await BloodUnit.findOneAndUpdate(
            { _id: req.params.id, hospital_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!bloodUnit) {
            return res.status(404).json({
                success: false,
                message: 'Blood unit not found'
            });
        }

        res.json({
            success: true,
            message: 'Blood unit updated successfully',
            data: bloodUnit
        });

    } catch (error) {
        console.error('Update blood unit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update blood unit',
            error: error.message
        });
    }
});

/**
 * DELETE /inventory/:id
 * Delete blood unit
 * Access: BLOODBANK_ADMIN
 */
router.delete('/:id', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const userRole = req.headers['x-user-role'];

        // Only admin can delete
        if (userRole !== 'BLOODBANK_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete inventory'
            });
        }

        const bloodUnit = await BloodUnit.findOneAndDelete({
            _id: req.params.id,
            hospital_id
        });

        if (!bloodUnit) {
            return res.status(404).json({
                success: false,
                message: 'Blood unit not found'
            });
        }

        res.json({
            success: true,
            message: 'Blood unit deleted successfully'
        });

    } catch (error) {
        console.error('Delete blood unit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete blood unit',
            error: error.message
        });
    }
});

/**
 * PUT /inventory/:id/reserve
 * Reserve blood unit
 * Access: BLOODBANK_ADMIN
 */
router.put('/:id/reserve', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];

        const bloodUnit = await BloodUnit.findOne({
            _id: req.params.id,
            hospital_id,
            status: 'available'
        });

        if (!bloodUnit) {
            return res.status(404).json({
                success: false,
                message: 'Blood unit not found or not available'
            });
        }

        if (bloodUnit.isExpired()) {
            return res.status(400).json({
                success: false,
                message: 'Blood unit is expired'
            });
        }

        bloodUnit.status = 'reserved';
        await bloodUnit.save();

        res.json({
            success: true,
            message: 'Blood unit reserved successfully',
            data: bloodUnit
        });

    } catch (error) {
        console.error('Reserve blood unit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reserve blood unit',
            error: error.message
        });
    }
});

/**
 * GET /inventory/expiring/soon
 * Get blood units expiring soon
 * Access: BLOODBANK_ADMIN
 */
router.get('/expiring/soon', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const days = parseInt(req.query.days) || 7;

        const expiryThreshold = new Date();
        expiryThreshold.setDate(expiryThreshold.getDate() + days);

        const expiringUnits = await BloodUnit.find({
            hospital_id,
            status: 'available',
            expiry_date: {
                $gt: new Date(),
                $lte: expiryThreshold
            }
        }).sort({ expiry_date: 1 });

        res.json({
            success: true,
            data: {
                expiring_units: expiringUnits,
                count: expiringUnits.length,
                threshold_days: days
            }
        });

    } catch (error) {
        console.error('Get expiring units error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expiring units',
            error: error.message
        });
    }
});

module.exports = router;
