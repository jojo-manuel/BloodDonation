const express = require('express');
const router = express.Router();
const { authMiddleware, requireStoreManager } = require('../middleware/auth');
const BloodInventory = require('../models/BloodInventory');
const User = require('../models/User');

// Simple auth middleware
const requireAuth = [authMiddleware, requireStoreManager];

// Middleware for inventory read access (more permissive)
const requireInventoryReadAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Allow store_manager, bleeding_staff, store_staff, and bloodbank roles
  const allowedRoles = ['store_manager', 'bleeding_staff', 'store_staff', 'bloodbank', 'BLOODBANK_ADMIN'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions to view inventory.'
    });
  }

  next();
};

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
 * Accessible by: store_manager, bleeding_staff, store_staff, bloodbank
 */
router.get('/inventory', [authMiddleware, requireInventoryReadAccess], async (req, res) => {
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

    const filteredInventory = await BloodInventory.find(query)
      .sort(sort)
      .populate('allocatedTo', 'name role email'); // Populate staff details

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
    if ((!bloodGroup && !itemName) || !serialNumber || !collectionDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Item name OR Blood group, serial number, collection date, and expiry date are required'
      });
    }

    const finalItemName = itemName || undefined;

    // Check for duplicate serial number for the same item type (or using hospital scope)
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
    const updateData = { ...req.body };

    // Auto-mark as 'used' if units count is 0
    if (updateData.unitsCount !== undefined && updateData.unitsCount <= 0) {
      updateData.status = 'used';
      updateData.unitsCount = 0; // Ensure it's exactly 0, not negative
    }

    const updatedItem = await BloodInventory.findOneAndUpdate(
      { _id: id, hospital_id: req.user.hospital_id },
      updateData,
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
      message: updatedItem.status === 'used' && updatedItem.unitsCount === 0
        ? 'Inventory item marked as sold out (used)'
        : 'Inventory item updated successfully',
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
    const { userId, notes, quantity } = req.body;
    let quantityToAllocate = parseInt(quantity);

    if (!quantityToAllocate || quantityToAllocate < 1) {
      quantityToAllocate = 1;
    }

    console.log(`[Allocate] Request for item ${id}, user ${userId}, hospital ${req.user.hospital_id}, units: ${quantityToAllocate}`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for allocation'
      });
    }

    // Verify staff exists in the same hospital
    const staffUser = await User.findOne({ _id: userId, hospital_id: req.user.hospital_id });
    if (!staffUser) {
      console.log(`[Allocate] Staff member not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    console.log(`[Allocate] Staff found: ${staffUser.name}`);

    // Find the inventory item
    const item = await BloodInventory.findOne({ _id: id, hospital_id: req.user.hospital_id });

    if (!item) {
      console.log(`[Allocate] Inventory item not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check availability
    if (quantityToAllocate > item.unitsCount) {
      return res.status(400).json({
        success: false,
        message: `Cannot allocate ${quantityToAllocate} units. Only ${item.unitsCount} available.`
      });
    }

    // If multiple units AND partial allocation
    if (item.unitsCount > quantityToAllocate) {
      // 1. Create a new item for the allocated unit
      const allocatedSerial = item.firstSerialNumber ? item.firstSerialNumber : item.serialNumber;

      const newItem = new BloodInventory({
        hospital_id: item.hospital_id,
        itemName: item.itemName,
        bloodGroup: item.bloodGroup,
        donationType: item.donationType,
        serialNumber: item.serialNumber, // Keep original batch string if exists
        firstSerialNumber: item.firstSerialNumber ? allocatedSerial : undefined,
        lastSerialNumber: item.firstSerialNumber ? (allocatedSerial + quantityToAllocate - 1) : undefined,
        unitsCount: quantityToAllocate,
        collectionDate: item.collectionDate,
        expiryDate: item.expiryDate,
        donorName: item.donorName,
        status: 'reserved',
        location: item.location,
        temperature: item.temperature,
        notes: item.notes,
        allocatedTo: userId,
        allocatedAt: new Date(),
        allocationNotes: notes,
        updatedBy: req.user.id,
        createdBy: req.user.id // Allocated copy created by manager
      });

      await newItem.save();

      // 2. Update the original item (reduce count, increment serial)
      item.unitsCount -= quantityToAllocate;

      if (item.firstSerialNumber) {
        item.firstSerialNumber += quantityToAllocate;
      }

      // Mark as used if no units remain
      if (item.unitsCount <= 0) {
        item.unitsCount = 0;
        item.status = 'used';
      }

      item.updatedBy = req.user.id;
      await item.save();

      console.log(`[Allocate] Split batch. Allocated ${quantityToAllocate} units. Remaining: ${item.unitsCount}`);

      return res.json({
        success: true,
        message: `Allocated ${quantityToAllocate} units successfully`,
        data: newItem
      });

    } else {
      // Allocate the entire item (or remaining part matches request)
      item.allocatedTo = userId;
      item.allocatedAt = new Date();
      item.allocationNotes = notes;
      item.status = 'reserved';
      item.updatedBy = req.user.id;

      await item.save();

      const populatedItem = await item.populate('allocatedTo', 'name email role');

      console.log(`[Allocate] Success (Full/Remaining units)`);

      return res.json({
        success: true,
        message: 'Item allocated successfully',
        data: populatedItem
      });
    }

  } catch (error) {
    console.error('Allocation error detailed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate item',
      error: error.message
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