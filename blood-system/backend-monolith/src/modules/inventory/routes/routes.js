const express = require('express');
const { body, validationResult } = require('express-validator');
const BloodUnit = require('../models/BloodUnit');
const InventoryItem = require('../models/InventoryItem');
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

// ==============================================
// STORE MANAGER / INVENTORY ITEM ROUTES
// ==============================================

// Middleware to check if user is store manager or admin
const isStoreManagerOrAdmin = (req, res, next) => {
    const role = req.user.role;
    // Allow 'store_manager', 'store_staff', 'bloodbank', 'BLOODBANK_ADMIN', 'admin'
    const allowed = ['store_manager', 'store_staff', 'bloodbank', 'BLOODBANK_ADMIN', 'admin'];
    if (allowed.includes(role)) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Store Manager role required.' });
};

// GET /api/inventory/items - List all inventory items
router.get('/items', verifyToken, isStoreManagerOrAdmin, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id || req.query.hospital_id;
        const items = await InventoryItem.find({ hospital_id }).sort({ expiryDate: 1 });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch inventory items', error: error.message });
    }
});

// POST /api/inventory/items - Add new item
router.post('/items', verifyToken, isStoreManagerOrAdmin, [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be positive'),
    body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
    body('hospital_id').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const hospital_id = req.user.hospital_id || req.body.hospital_id;
        if (!hospital_id) return res.status(400).json({ success: false, message: 'Hospital ID is required' });

        const item = new InventoryItem({
            ...req.body,
            hospital_id,
            addedBy: req.user.user_id || req.user._id
        });

        await item.save();
        res.status(201).json({ success: true, message: 'Item added successfully', data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add item', error: error.message });
    }
});

// PUT /api/inventory/items/:id - Update item
router.put('/items/:id', verifyToken, isStoreManagerOrAdmin, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const item = await InventoryItem.findOneAndUpdate(
            { _id: req.params.id, hospital_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, message: 'Item updated successfully', data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update item', error: error.message });
    }
});

// DELETE /api/inventory/items/:id - Delete item
router.delete('/items/:id', verifyToken, isStoreManagerOrAdmin, async (req, res) => {
    try {
        const hospital_id = req.user.hospital_id;
        const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, hospital_id });

        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete item', error: error.message });
    }
});

// POST /api/inventory/items/:id/allocate - Allocate item
router.post('/items/:id/allocate', verifyToken, isStoreManagerOrAdmin, async (req, res) => {
    try {
        const { quantity, allocatedTo } = req.body;
        const hospital_id = req.user.hospital_id;

        const item = await InventoryItem.findOne({ _id: req.params.id, hospital_id });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        if (!allocatedTo) return res.status(400).json({ success: false, message: 'Allocation recipient (allocatedTo) is required' });

        // Logic 1: Serialized Item (Quantity usually 1, or treat as unit)
        if (item.serialNumber) {
            if (item.status === 'allocated') return res.status(400).json({ success: false, message: 'Item already allocated' });

            item.status = 'allocated';
            item.allocatedTo = allocatedTo;
            await item.save();
            return res.json({ success: true, message: 'Item allocated successfully', data: item });
        }

        // Logic 2: Bulk Item
        const allocateQty = parseInt(quantity);
        if (isNaN(allocateQty) || allocateQty <= 0) return res.status(400).json({ success: false, message: 'Valid quantity required' });

        if (item.quantity < allocateQty) return res.status(400).json({ success: false, message: 'Insufficient quantity' });

        // Reduce quantity
        item.quantity -= allocateQty;
        // Optionally create a separate "Allocated" record? 
        // For now, we simply reduce the stock as per standard "Allocate/Consumer" flow
        // The user asked to "allocate", implying the stock is used/moved. 
        // We will just reduce the count.

        await item.save();
        res.json({ success: true, message: `Allocated ${allocateQty} items to ${allocatedTo}`, data: item });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to allocate item', error: error.message });
    }
});

module.exports = router;
