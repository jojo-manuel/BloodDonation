const express = require('express');
const router = express.Router();
const { authMiddleware, requireStoreManager } = require('../middleware/auth');
const BloodInventory = require('../models/BloodInventory');
const User = require('../models/User');

// Simple auth middleware
const requireAuth = [authMiddleware, requireStoreManager];

/**
 * GET /api/store-manager/analytics
 * Get dashboard analytics for store manager
 */
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const today = new Date();
    const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Calculate analytics from database
    const totalUnits = await BloodInventory.aggregate([
      { $match: { hospital_id } },
      { $group: { _id: null, total: { $sum: '$unitsCount' } } }
    ]);

    const availableUnits = await BloodInventory.aggregate([
      { $match: { hospital_id, status: 'available' } },
      { $group: { _id: null, total: { $sum: '$unitsCount' } } }
    ]);

    const reservedUnits = await BloodInventory.aggregate([
      { $match: { hospital_id, status: 'reserved' } },
      { $group: { _id: null, total: { $sum: '$unitsCount' } } }
    ]);

    const expiredUnits = await BloodInventory.aggregate([
      { $match: { hospital_id, status: 'expired' } },
      { $group: { _id: null, total: { $sum: '$unitsCount' } } }
    ]);

    const expiringUnits = await BloodInventory.aggregate([
      {
        $match: {
          hospital_id,
          status: 'available',
          expiryDate: { $lte: fourteenDaysFromNow, $gt: today }
        }
      },
      { $group: { _id: null, total: { $sum: '$unitsCount' } } }
    ]);

    // Blood group distribution
    const bloodGroupDistribution = await BloodInventory.aggregate([
      { $match: { hospital_id } },
      { $group: { _id: '$bloodGroup', count: { $sum: '$unitsCount' } } },
      { $sort: { _id: 1 } }
    ]);

    // Expiry alerts
    const expiryAlerts = await BloodInventory.find({
      hospital_id,
      status: 'available',
      expiryDate: { $lte: fourteenDaysFromNow, $gt: today }
    }).sort({ expiryDate: 1 });

    res.json({
      success: true,
      data: {
        totalUnits: totalUnits[0]?.total || 0,
        availableUnits: availableUnits[0]?.total || 0,
        reservedUnits: reservedUnits[0]?.total || 0,
        expiredUnits: expiredUnits[0]?.total || 0,
        expiringUnits: expiringUnits[0]?.total || 0,
        bloodGroupDistribution,
        expiryAlerts
      }
    });
  } catch (error) {
    console.error('Store manager analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

/**
 * GET /api/store-manager/inventory
 * Get blood inventory with filtering and sorting
 */
/**
 * GET /api/store-manager/inventory
 * Get blood inventory with filtering and sorting
 */
router.get('/inventory', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const {
      search,
      bloodGroup,
      status,
      expiry,
      sortBy = 'expiryDate'
    } = req.query;

    let query = { hospital_id };

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { donorName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { bloodGroup: { $regex: search, $options: 'i' } }
      ];
    }

    if (bloodGroup && bloodGroup !== 'all') {
      query.bloodGroup = bloodGroup;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    // Sort options
    let sort = {};
    if (sortBy === 'expiryDate') sort.expiryDate = 1;
    else if (sortBy === 'collectionDate') sort.collectionDate = -1;
    else if (sortBy === 'bloodGroup') sort.bloodGroup = 1;

    const filteredInventory = await BloodInventory.find(query).sort(sort);

    res.json({
      success: true,
      data: filteredInventory,
      pagination: {
        current: 1,
        pages: 1,
        total: filteredInventory.length
      }
    });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory'
    });
  }
});

/**
 * POST /api/store-manager/inventory
 * Create a new inventory item
 */
router.post('/inventory', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const {
      itemName,
      bloodGroup,
      donationType,
      serialNumber,
      quantity,
      collectionDate,
      expiryDate,
      donorName,
      status,
      location,
      temperature,
      notes
    } = req.body;

    // Validate required fields
    if (!serialNumber || !collectionDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Serial number, collection date, and expiry date are required'
      });
    }

    const finalItemName = itemName || 'General Inventory';

    // Check for duplicate serial number for the same item type (or globally for hospital?)
    // User said "dont allow same object from forming duplicste".
    // I'll scope it to itemName to allow different items to have same serial if needed, OR just hospital_id + serialNumber if serials are strictly unique tags.
    // Given it's "store", usually barcode/RFID is unique globally. But "Serial Number" might be "Batch A".
    // Let's assume unique per hospital for safety, or unique per item.
    // "allow object with similar serials number" -> maybe allow "Syringe A1" and "Bandage A1".
    // So distinct by (hospital_id, itemName, serialNumber).
    const duplicate = await BloodInventory.findOne({
      hospital_id,
      itemName: finalItemName,
      serialNumber
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Item with this serial number already exists'
      });
    }

    const newItem = new BloodInventory({
      hospital_id,
      itemName: finalItemName,
      bloodGroup: bloodGroup || undefined,
      donationType: donationType || 'whole_blood',
      serialNumber,
      unitsCount: quantity || 1,
      collectionDate: new Date(collectionDate),
      expiryDate: new Date(expiryDate),
      donorName: donorName || '',
      status: status || 'available',
      location: location || '',
      temperature: temperature || '',
      notes: notes || ''
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Inventory creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create inventory item'
    });
  }
});

/**
 * PUT /api/store-manager/inventory/:id
 * Update an inventory item
 */
router.put('/inventory/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Explicitly update only allowed fields to prevent overwriting critical ones if needed, or just standard update
    // For now, standard update using body
    const updatedItem = await BloodInventory.findOneAndUpdate(
      { _id: id, hospital_id: req.user.hospital_id },
      req.body,
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Inventory update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item'
    });
  }
});

/**
 * PUT /api/store-manager/inventory/:id/status
 * Update inventory item status
 */
router.put('/inventory/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'reserved', 'used', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updatedItem = await BloodInventory.findOneAndUpdate(
      { _id: id, hospital_id: req.user.hospital_id },
      { status: status },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: updatedItem
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

/**
 * DELETE /api/store-manager/inventory/:id
 * Delete an inventory item
 */
router.delete('/inventory/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await BloodInventory.findOneAndDelete({ _id: id, hospital_id: req.user.hospital_id });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Inventory deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item'
    });
  }
});

/**
 * GET /api/store-manager/expiry-alerts
 * Get items expiring soon
 */
router.get('/expiry-alerts', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const today = new Date();
    const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const expiryAlerts = await BloodInventory.find({
      hospital_id,
      status: 'available',
      expiryDate: { $lte: fourteenDaysFromNow, $gt: today }
    }).sort({ expiryDate: 1 });

    res.json({
      success: true,
      data: expiryAlerts
    });
  } catch (error) {
    console.error('Expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiry alerts'
    });
  }
});

/**
 * PUT /api/store-manager/inventory/:id/allocate
 * Allocate inventory item to a staff member
 */
router.put('/inventory/:id/allocate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, notes } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for allocation'
      });
    }

    // Verify staff exists in the same hospital
    const staffUser = await User.findOne({ _id: userId, hospital_id: req.user.hospital_id });
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const updatedItem = await BloodInventory.findOneAndUpdate(
      { _id: id, hospital_id: req.user.hospital_id },
      {
        allocatedTo: userId,
        allocatedAt: new Date(),
        allocationNotes: notes,
        status: 'reserved' // Marking as reserved when allocated
      },
      { new: true }
    ).populate('allocatedTo', 'name email role');

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item allocated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate item'
    });
  }
});

/**
 * GET /api/store-manager/staff
 * Get staff members for allocation
 */
router.get('/staff', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const staff = await User.find({
      hospital_id,
      role: { $in: ['doctor', 'bleeding_staff', 'store_staff', 'frontdesk', 'centrifuge_staff'] }
    }).select('name email role');

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Staff fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff'
    });
  }
});

module.exports = router;