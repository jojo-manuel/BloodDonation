const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const BloodInventory = require('../models/BloodInventory');

// Middleware for store staff authorization
const requireStoreStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!['store_staff', 'store_manager', 'bloodbank', 'BLOODBANK_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Store staff role required.'
    });
  }

  next();
};

const requireAuth = [authMiddleware, requireStoreStaff];

/**
 * GET /api/store-staff/inventory
 * Get blood inventory with filtering and sorting for store staff
 */
router.get('/inventory', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const { 
      search, 
      bloodGroup, 
      status, 
      sortBy = 'expiryDate',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    let query = { hospital_id };
    
    if (bloodGroup && bloodGroup !== 'all') {
      query.bloodGroup = bloodGroup;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { firstSerialNumber: parseInt(search) || 0 },
        { lastSerialNumber: parseInt(search) || 0 }
      ];
    }

    // Build sort object
    let sort = {};
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    
    switch (sortBy) {
      case 'expiryDate':
        sort.expiryDate = sortDirection;
        break;
      case 'collectionDate':
        sort.collectionDate = sortDirection;
        break;
      case 'bloodGroup':
        sort.bloodGroup = sortDirection;
        break;
      case 'status':
        sort.status = sortDirection;
        break;
      default:
        sort.expiryDate = 1; // Default ascending by expiry date
    }

    const inventory = await BloodInventory.find(query)
      .sort(sort)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    res.json({
      success: true,
      data: inventory,
      pagination: {
        current: 1,
        pages: 1,
        total: inventory.length
      }
    });
  } catch (error) {
    console.error('Store staff inventory fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory'
    });
  }
});

/**
 * POST /api/store-staff/inventory
 * Create a new inventory item
 */
router.post('/inventory', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const {
      bloodGroup,
      donationType,
      firstSerialNumber,
      lastSerialNumber,
      collectionDate,
      expiryDate,
      donorName,
      status,
      location,
      temperature,
      notes
    } = req.body;

    // Validate required fields
    if (!bloodGroup || !firstSerialNumber || !lastSerialNumber || !collectionDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Blood group, serial numbers, collection date, and expiry date are required'
      });
    }

    // Validate serial number range
    const firstSerial = parseInt(firstSerialNumber);
    const lastSerial = parseInt(lastSerialNumber);
    
    if (firstSerial > lastSerial) {
      return res.status(400).json({
        success: false,
        message: 'First serial number must be less than or equal to last serial number'
      });
    }

    // Check for overlapping serial numbers
    const overlapping = await BloodInventory.findOne({
      hospital_id,
      $or: [
        {
          firstSerialNumber: { $lte: lastSerial },
          lastSerialNumber: { $gte: firstSerial }
        }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Serial number range overlaps with existing inventory'
      });
    }

    // Validate dates
    const collectionDateObj = new Date(collectionDate);
    const expiryDateObj = new Date(expiryDate);
    
    if (expiryDateObj <= collectionDateObj) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be after collection date'
      });
    }

    const newItem = new BloodInventory({
      hospital_id,
      bloodGroup,
      donationType: donationType || 'whole_blood',
      firstSerialNumber: firstSerial,
      lastSerialNumber: lastSerial,
      unitsCount: lastSerial - firstSerial + 1,
      collectionDate: collectionDateObj,
      expiryDate: expiryDateObj,
      donorName: donorName || '',
      status: status || 'available',
      location: location || '',
      temperature: temperature || '2-6°C',
      notes: notes || '',
      createdBy: req.user.id
    });

    await newItem.save();

    // Populate the created item
    await newItem.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Store staff inventory creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create inventory item'
    });
  }
});

/**
 * PUT /api/store-staff/inventory/:id
 * Update an inventory item
 */
router.put('/inventory/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const hospital_id = req.user.hospital_id;

    // Find the item first to ensure it belongs to the hospital
    const item = await BloodInventory.findOne({ _id: id, hospital_id });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Validate serial number range if being updated
    if (updates.firstSerialNumber || updates.lastSerialNumber) {
      const firstSerial = parseInt(updates.firstSerialNumber || item.firstSerialNumber);
      const lastSerial = parseInt(updates.lastSerialNumber || item.lastSerialNumber);
      
      if (firstSerial > lastSerial) {
        return res.status(400).json({
          success: false,
          message: 'First serial number must be less than or equal to last serial number'
        });
      }

      // Check for overlapping serial numbers (excluding current item)
      const overlapping = await BloodInventory.findOne({
        _id: { $ne: id },
        hospital_id,
        $or: [
          {
            firstSerialNumber: { $lte: lastSerial },
            lastSerialNumber: { $gte: firstSerial }
          }
        ]
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: 'Serial number range overlaps with existing inventory'
        });
      }

      // Update units count
      updates.unitsCount = lastSerial - firstSerial + 1;
    }

    // Validate dates if being updated
    if (updates.collectionDate || updates.expiryDate) {
      const collectionDate = new Date(updates.collectionDate || item.collectionDate);
      const expiryDate = new Date(updates.expiryDate || item.expiryDate);
      
      if (expiryDate <= collectionDate) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date must be after collection date'
        });
      }
    }

    // Add metadata
    updates.updatedBy = req.user.id;

    const updatedItem = await BloodInventory.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name');

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Store staff inventory update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item'
    });
  }
});

/**
 * PUT /api/store-staff/inventory/:id/take
 * Mark an inventory item as taken by a department
 */
router.put('/inventory/:id/take', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { department, takenBy, reason, notes } = req.body;
    const hospital_id = req.user.hospital_id;

    // Validate required fields
    if (!department || !takenBy || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Department, taken by, and reason are required'
      });
    }

    // Find the item
    const item = await BloodInventory.findOne({ _id: id, hospital_id });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check if item is available
    if (item.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for taking'
      });
    }

    // Update the item
    const updateData = {
      status: 'used',
      takenBy,
      department,
      reason,
      takenAt: new Date(),
      updatedBy: req.user.id
    };

    // Append to notes
    const takeNote = `Taken by ${takenBy} for ${department} - ${reason}`;
    updateData.notes = item.notes ? `${item.notes}\n${takeNote}` : takeNote;
    
    if (notes) {
      updateData.notes += `\nAdditional notes: ${notes}`;
    }

    const updatedItem = await BloodInventory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name');

    res.json({
      success: true,
      message: 'Item marked as taken successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Store staff take item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark item as taken'
    });
  }
});

/**
 * PUT /api/store-staff/inventory/:id/status
 * Update inventory item status
 */
router.put('/inventory/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const hospital_id = req.user.hospital_id;

    const validStatuses = ['available', 'reserved', 'used', 'expired', 'quarantine'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find the item
    const item = await BloodInventory.findOne({ _id: id, hospital_id });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const updateData = { 
      status,
      updatedBy: req.user.id
    };

    // Add status change note
    const statusNote = `Status changed from ${item.status} to ${status} by ${req.user.name || req.user.username}`;
    updateData.notes = item.notes ? `${item.notes}\n${statusNote}` : statusNote;
    
    if (reason) {
      updateData.notes += ` - Reason: ${reason}`;
    }

    const updatedItem = await BloodInventory.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name');

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: updatedItem
    });
  } catch (error) {
    console.error('Store staff status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

/**
 * DELETE /api/store-staff/inventory/:id
 * Delete an inventory item
 */
router.delete('/inventory/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const hospital_id = req.user.hospital_id;

    // Find and delete the item
    const deletedItem = await BloodInventory.findOneAndDelete({ _id: id, hospital_id });
    
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Store staff inventory deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item'
    });
  }
});

/**
 * GET /api/store-staff/analytics
 * Get basic analytics for store staff
 */
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const today = new Date();
    const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const totalItems = await BloodInventory.countDocuments({ hospital_id });
    const availableItems = await BloodInventory.countDocuments({ hospital_id, status: 'available' });
    const usedItems = await BloodInventory.countDocuments({ hospital_id, status: 'used' });
    const expiredItems = await BloodInventory.countDocuments({ hospital_id, status: 'expired' });
    
    // Items expiring soon
    const expiringSoon = await BloodInventory.countDocuments({
      hospital_id,
      status: 'available',
      expiryDate: { $lte: fourteenDaysFromNow, $gt: today }
    });

    // Blood group distribution
    const bloodGroupDistribution = await BloodInventory.aggregate([
      { $match: { hospital_id } },
      { $group: { _id: '$bloodGroup', count: { $sum: '$unitsCount' } } },
      { $sort: { _id: 1 } }
    ]);

    // Recent activity (items taken in last 7 days)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentlyTaken = await BloodInventory.find({
      hospital_id,
      status: 'used',
      takenAt: { $gte: sevenDaysAgo }
    }).sort({ takenAt: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalItems,
          availableItems,
          usedItems,
          expiredItems,
          expiringSoon
        },
        bloodGroupDistribution,
        recentActivity: recentlyTaken
      }
    });
  } catch (error) {
    console.error('Store staff analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

/**
 * GET /api/store-staff/expiry-alerts
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
    console.error('Store staff expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiry alerts'
    });
  }
});

module.exports = router;