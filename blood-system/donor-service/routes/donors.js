const express = require('express');
const { body, validationResult } = require('express-validator');
const Donor = require('../models/Donor');
const { validateEligibility } = require('../middleware/eligibility');

const router = express.Router();

// ==========================================
// VALIDATION RULES
// ==========================================

const donorValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('contact').trim().notEmpty().withMessage('Contact is required'),
    body('age').isInt({ min: 18, max: 65 }).withMessage('Age must be between 18 and 65')
    // hospital_id validation removed
];

// ==========================================
// ROUTES
// ==========================================

/**
 * POST /donors
 * Create a new donor profile
 * Access: Authenticated User / BLOODBANK_ADMIN
 */
router.post('/', donorValidation, validateEligibility, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Get hospital_id from headers (set by gateway)
        const hospital_id = req.headers['x-hospital-id'] || req.body.hospital_id || 'generic';
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required for registration' });
        }

        // Check if donor already exists
        const existingDonor = await Donor.findOne({ userId });
        if (existingDonor) {
            return res.status(400).json({ success: false, message: 'You are already registered as a donor' });
        }

        const donor = new Donor({
            ...req.body,
            hospital_id,
            userId
        });

        await donor.save();

        res.status(201).json({
            success: true,
            message: 'Donor created successfully',
            data: {
                donor,
                eligibility: req.eligibilityInfo
            }
        });

    } catch (error) {
        console.error('Create donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create donor',
            error: error.message
        });
    }
});

/**
 * GET /cities/available
 * Get list of cities with active donors
 * Access: Authenticated User
 */
router.get('/cities/available', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];

        // Find distinct cities from active donors associated with this hospital (or all if no hospital context forced, but usually filtered)
        // If hospital_id is present, filter by it. If not (e.g. general search), maybe all? 
        // Gateway might strictly enforce hospital isolation.
        // For 'Donor' user looking for blood, they want ALL available cities, not just one hospital's.
        // The Gateway's `enforceHospitalIsolation` likely sets `x-hospital-id` for Admin/Hospital users.
        // A Donor user might NOT have `x-hospital-id` header if it's not their org.

        const query = { isActive: true };
        if (hospital_id) {
            query.hospital_id = hospital_id;
        }

        const cities = await Donor.distinct('address.city', query);
        res.json({
            success: true,
            data: cities.filter(c => c) // remove nulls
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /donors
 * List all donors (filtered by hospital_id)
 * Access: BLOODBANK_ADMIN
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

        const { blood_group, eligible, page = 1, limit = 20 } = req.query;

        // Build query
        const query = { hospital_id, isActive: true };

        if (blood_group) {
            query.blood_group = blood_group;
        }

        if (eligible !== undefined) {
            query.eligibility_status = eligible === 'true';
        }

        // Pagination
        const skip = (page - 1) * limit;

        const donors = await Donor.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Donor.countDocuments(query);

        res.json({
            success: true,
            data: {
                donors,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('List donors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donors',
            error: error.message
        });
    }
});

/**
 * GET /address/:postalCode
 * Get address details by postal code
 * Access: Authenticated User
 */
router.get('/address/:postalCode', async (req, res) => {
    try {
        const { postalCode } = req.params;

        // Use India Post API
        const response = await fetch(`https://api.postalpincode.in/pincode/${postalCode}`);
        const data = await response.json();

        if (data && data.length > 0 && data[0].Status === 'Success') {
            res.json({
                success: true,
                data: data[0].PostOffice
            });
        } else {
            res.status(404).json({ success: false, message: 'Invalid pincode or no data found' });
        }
    } catch (error) {
        console.error('Pincode fetch error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch address' });
    }
});

/**
 * GET /me
 * Get current user's donor profile
 * Access: Authenticated User
 */
router.get('/me', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID not found in context' });
        }

        const donor = await Donor.findOne({ userId: userId });

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor profile not found',
                requiresRegistration: true
            });
        }

        res.json({ success: true, data: donor });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /donors/:id
 * Get donor by ID
 * Access: BLOODBANK_ADMIN
 */
router.get('/:id', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const donor = await Donor.findOne({
            _id: req.params.id,
            hospital_id
        });

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        // Check current eligibility
        const eligibilityCheck = donor.checkEligibility();

        res.json({
            success: true,
            data: {
                donor,
                eligibility: eligibilityCheck
            }
        });

    } catch (error) {
        console.error('Get donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donor',
            error: error.message
        });
    }
});

/**
 * PUT /donors/:id
 * Update donor profile
 * Access: BLOODBANK_ADMIN
 */
router.put('/:id', validateEligibility, async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];

        const donor = await Donor.findOneAndUpdate(
            { _id: req.params.id, hospital_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        res.json({
            success: true,
            message: 'Donor updated successfully',
            data: {
                donor,
                eligibility: req.eligibilityInfo
            }
        });

    } catch (error) {
        console.error('Update donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update donor',
            error: error.message
        });
    }
});

/**
 * DELETE /donors/:id
 * Soft delete donor (set isActive to false)
 * Access: BLOODBANK_ADMIN
 */
router.delete('/:id', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];

        const donor = await Donor.findOneAndUpdate(
            { _id: req.params.id, hospital_id },
            { isActive: false },
            { new: true }
        );

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        res.json({
            success: true,
            message: 'Donor deleted successfully'
        });

    } catch (error) {
        console.error('Delete donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete donor',
            error: error.message
        });
    }
});

/**
 * GET /donors/:id/eligibility
 * Check donor eligibility
 * Access: BLOODBANK_ADMIN
 */
router.get('/:id/eligibility', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];
        const donor = await Donor.findOne({
            _id: req.params.id,
            hospital_id
        });

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        const eligibilityCheck = donor.checkEligibility();

        // Update donor with latest eligibility
        donor.eligibility_status = eligibilityCheck.eligible;
        donor.eligibility_notes = eligibilityCheck.reasons.join('; ');
        await donor.save();

        res.json({
            success: true,
            data: eligibilityCheck
        });

    } catch (error) {
        console.error('Check eligibility error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check eligibility',
            error: error.message
        });
    }
});


/**
 * GET /test-collection
 * Fetch data from 'test' collection and 'donors' collection
 * Access: Public (for debugging)
 */
router.get('/test-collection', async (req, res) => {
    try {
        // Access the raw 'test' collection from the database
        const testCollectionData = await Donor.db.collection('test').find({}).toArray();

        // Fetch donors data
        const donorsData = await Donor.find({}).limit(20);

        res.json({
            success: true,
            data: {
                test_collection: testCollectionData,
                donors_collection: donorsData
            }
        });
    } catch (error) {
        console.error('Fetch test collection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch combined data',
            error: error.message
        });
    }
});

module.exports = router;
