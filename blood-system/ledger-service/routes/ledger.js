const express = require('express');
const crypto = require('crypto');
const LedgerEntry = require('../models/LedgerEntry');

const router = express.Router();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate hash for transaction data
 */
function generateHash(data) {
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(data))
        .digest('hex');
}

/**
 * Get the last ledger entry for chain continuity
 */
async function getLastEntry(hospital_id) {
    return await LedgerEntry.findOne({ hospital_id })
        .sort({ createdAt: -1 })
        .select('data_hash');
}

// ==========================================
// ROUTES
// ==========================================

/**
 * POST /ledger/log
 * Store audit log entry
 * Access: BLOODBANK_ADMIN
 */
router.post('/log', async (req, res) => {
    try {
        const { transaction_type, data, metadata } = req.body;
        const hospital_id = req.headers['x-hospital-id'] || req.body.hospital_id;
        const user_id = req.headers['x-user-id'];

        if (!transaction_type || !data) {
            return res.status(400).json({
                success: false,
                message: 'transaction_type and data are required'
            });
        }

        // Generate transaction ID
        const transaction_id = `${transaction_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Generate hash of the data
        const data_hash = generateHash(data);

        // Get previous hash for chain continuity
        const lastEntry = await getLastEntry(hospital_id);
        const previous_hash = lastEntry ? lastEntry.data_hash : '0';

        const ledgerEntry = new LedgerEntry({
            transaction_id,
            transaction_type,
            hospital_id,
            user_id,
            data_hash,
            previous_hash,
            metadata
        });

        await ledgerEntry.save();

        res.status(201).json({
            success: true,
            message: 'Ledger entry created successfully',
            data: {
                transaction_id: ledgerEntry.transaction_id,
                data_hash: ledgerEntry.data_hash,
                previous_hash: ledgerEntry.previous_hash,
                timestamp: ledgerEntry.createdAt
            }
        });

    } catch (error) {
        console.error('Create ledger entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ledger entry',
            error: error.message
        });
    }
});

/**
 * GET /ledger/entries
 * Get ledger entries
 * Access: BLOODBANK_ADMIN
 */
router.get('/entries', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'] || req.query.hospital_id;
        const { transaction_type, page = 1, limit = 50 } = req.query;

        const query = { hospital_id };

        if (transaction_type) {
            query.transaction_type = transaction_type;
        }

        const skip = (page - 1) * limit;

        const entries = await LedgerEntry.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await LedgerEntry.countDocuments(query);

        res.json({
            success: true,
            data: {
                entries,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get ledger entries error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ledger entries',
            error: error.message
        });
    }
});

/**
 * GET /ledger/verify/:transaction_id
 * Verify ledger entry integrity
 * Access: BLOODBANK_ADMIN
 */
router.get('/verify/:transaction_id', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'];

        const entry = await LedgerEntry.findOne({
            transaction_id: req.params.transaction_id,
            hospital_id
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Ledger entry not found'
            });
        }

        // Verify chain continuity
        const previousEntry = await LedgerEntry.findOne({
            hospital_id,
            createdAt: { $lt: entry.createdAt }
        }).sort({ createdAt: -1 });

        const isValid = !previousEntry || entry.previous_hash === previousEntry.data_hash;

        res.json({
            success: true,
            data: {
                transaction_id: entry.transaction_id,
                is_valid: isValid,
                data_hash: entry.data_hash,
                previous_hash: entry.previous_hash,
                timestamp: entry.createdAt
            }
        });

    } catch (error) {
        console.error('Verify ledger entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify ledger entry',
            error: error.message
        });
    }
});

module.exports = router;
