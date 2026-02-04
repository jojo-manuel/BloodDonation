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

  // Allow store_manager, bleeding_staff, store_staff, bloodbank, doctor, and centrifuge_staff roles
  const allowedRoles = ['store_manager', 'bleeding_staff', 'store_staff', 'bloodbank', 'BLOODBANK_ADMIN', 'doctor', 'centrifuge_staff'];
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
      notes,
      price
    } = req.body;

    // Validate required fields
    if ((!bloodGroup && !itemName) || !serialNumber || !collectionDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Item name OR Blood group, serial number, collection date, and expiry date are required'
      });
    }

    // Validate collection date (cannot be before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    const collection = new Date(collectionDate);
    collection.setHours(0, 0, 0, 0);

    if (collection < today) {
      return res.status(400).json({
        success: false,
        message: 'Collection date cannot be before today'
      });
    }

    // Validate expiry date (must be at least 6 months from today)
    const expiry = new Date(expiryDate);
    const minExpiryDate = new Date();
    minExpiryDate.setHours(0, 0, 0, 0);
    minExpiryDate.setMonth(minExpiryDate.getMonth() + 6); // Add 6 months

    if (expiry < minExpiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be at least 6 months from today'
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
      notes: notes || '',
      price: price || 0,
      createdBy: req.user.id,
      updatedBy: req.user.id
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

    // Validate dates if being updated
    if (updateData.collectionDate || updateData.expiryDate) {
      // Get the current item to compare dates
      const currentItem = await BloodInventory.findOne({ _id: id, hospital_id: req.user.hospital_id });

      if (!currentItem) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found or unauthorized'
        });
      }

      const collectionDate = updateData.collectionDate ? new Date(updateData.collectionDate) : currentItem.collectionDate;
      const expiryDate = updateData.expiryDate ? new Date(updateData.expiryDate) : currentItem.expiryDate;

      // Validate collection date (cannot be before today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const collection = new Date(collectionDate);
      collection.setHours(0, 0, 0, 0);

      if (collection < today) {
        return res.status(400).json({
          success: false,
          message: 'Collection date cannot be before today'
        });
      }

      // Validate expiry date (must be at least 6 months from today)
      const expiry = new Date(expiryDate);
      const minExpiryDate = new Date();
      minExpiryDate.setHours(0, 0, 0, 0);
      minExpiryDate.setMonth(minExpiryDate.getMonth() + 6);

      if (expiry < minExpiryDate) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date must be at least 6 months from today'
        });
      }
    }

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
 * POST /api/store-manager/inventory/:id/purchase
 * Purchase inventory item by units
 * Accessible by: doctor, bleeding_staff, centrifuge_staff, store_manager
 */
router.post('/inventory/:id/purchase', [authMiddleware, requireInventoryReadAccess], async (req, res) => {
  try {
    const { id } = req.params;
    const { units, patientName, patientId, notes } = req.body;
    const hospital_id = req.user.hospital_id;

    if (!units || units < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid unit count is required'
      });
    }

    if (!patientName) {
      return res.status(400).json({
        success: false,
        message: 'Patient name is required'
      });
    }

    const inventoryItem = await BloodInventory.findOne({ _id: id, hospital_id });
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    if (inventoryItem.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for purchase'
      });
    }

    if (units > inventoryItem.unitsCount) {
      return res.status(400).json({
        success: false,
        message: `Only ${inventoryItem.unitsCount} units available`
      });
    }

    // Track the serial numbers being purchased
    const purchasedSerialStart = inventoryItem.firstSerialNumber || inventoryItem.serialNumber;
    const purchasedSerialEnd = purchasedSerialStart + units - 1;

    // Deduct units and update serial number range
    inventoryItem.unitsCount -= units;

    // Update the first serial number to reflect remaining inventory
    // The next available serial number starts after the purchased units
    if (inventoryItem.unitsCount > 0 && inventoryItem.firstSerialNumber) {
      inventoryItem.firstSerialNumber = purchasedSerialEnd + 1;
    }

    // If all units are consumed, mark as used
    if (inventoryItem.unitsCount === 0) {
      inventoryItem.status = 'used';
      inventoryItem.usedBy = req.user.id;
      inventoryItem.usedAt = new Date();
    }

    // Add purchase notes with serial number tracking
    const serialInfo = units === 1
      ? `Serial #${purchasedSerialStart}`
      : `Serials #${purchasedSerialStart}-${purchasedSerialEnd}`;

    const purchaseNote = `[${new Date().toISOString()}] Purchased ${units} unit(s) (${serialInfo}) for patient: ${patientName}${patientId ? ` (ID: ${patientId})` : ''}${notes ? `. Notes: ${notes}` : ''}. Purchased by: ${req.user.username || req.user.email || req.user.name || 'Staff'}`;

    inventoryItem.notes = inventoryItem.notes
      ? `${inventoryItem.notes}\n${purchaseNote}`
      : purchaseNote;

    inventoryItem.updatedBy = req.user.id;
    await inventoryItem.save();

    res.json({
      success: true,
      message: `Successfully purchased ${units} unit(s) (${serialInfo})`,
      data: {
        ...inventoryItem.toObject(),
        purchasedSerials: {
          start: purchasedSerialStart,
          end: purchasedSerialEnd,
          count: units
        }
      }
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete purchase'
    });
  }
});

module.exports = router;