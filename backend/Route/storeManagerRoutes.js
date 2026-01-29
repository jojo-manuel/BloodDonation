const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const BloodBank = require('../Models/BloodBank');
const BloodInventory = require('../Models/BloodInventory');
const User = require('../Models/User');

// Middleware to ensure user is a store manager or blood bank admin
const requireStoreManager = async (req, res, next) => {
  try {
    if (!['store_manager', 'bloodbank'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Store manager role required.'
      });
    }

    // Get blood bank details for the user
    const bloodBank = await BloodBank.findOne({ 
      $or: [
        { userId: req.user.id },
        { _id: req.user.bloodBankId }
      ]
    });
    
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found for this user'
      });
    }

    req.bloodBank = bloodBank;
    next();
  } catch (error) {
    console.error('Store manager middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Apply authentication and store manager middleware to all routes
router.use(authMiddleware);
router.use(requireStoreManager);

/**
 * GET /api/store-manager/analytics
 * Get dashboard analytics for store manager
 */
router.get('/analytics', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Get overview statistics
    const [
      totalUnits,
      availableUnits,
      reservedUnits,
      expiredUnits,
      expiringUnits
    ] = await Promise.all([
      BloodInventory.aggregate([
        { $match: { bloodBankId } },
        { $group: { _id: null, total: { $sum: '$unitsCount' } } }
      ]).then(result => result[0]?.total || 0),
      
      BloodInventory.aggregate([
        { $match: { bloodBankId, status: 'available' } },
        { $group: { _id: null, total: { $sum: '$unitsCount' } } }
      ]).then(result => result[0]?.total || 0),
      
      BloodInventory.aggregate([
        { $match: { bloodBankId, status: 'reserved' } },
        { $group: { _id: null, total: { $sum: '$unitsCount' } } }
      ]).then(result => result[0]?.total || 0),
      
      BloodInventory.aggregate([
        { $match: { bloodBankId, status: 'expired' } },
        { $group: { _id: null, total: { $sum: '$unitsCount' } } }
      ]).then(result => result[0]?.total || 0),
      
      BloodInventory.aggregate([
        { 
          $match: { 
            bloodBankId, 
            status: { $in: ['available', 'reserved'] },
            expiryDate: { $lte: fourteenDaysFromNow, $gt: today }
          } 
        },
        { $group: { _id: null, total: { $sum: '$unitsCount' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    // Get blood group distribution
    const bloodGroupDistribution = await BloodInventory.aggregate([
      { $match: { bloodBankId, status: { $in: ['available', 'reserved'] } } },
      { $group: { _id: '$bloodGroup', count: { $sum: '$unitsCount' } } },
      { $sort: { _id: 1 } }
    ]);

    // Get expiry alerts (items expiring within 14 days)
    const expiryAlerts = await BloodInventory.find({
      bloodBankId,
      status: { $in: ['available', 'reserved'] },
      expiryDate: { $lte: fourteenDaysFromNow, $gt: today }
    }).sort({ expiryDate: 1 }).limit(10);

    res.json({
      success: true,
      data: {
        totalUnits,
        availableUnits,
        reservedUnits,
        expiredUnits,
        expiringUnits,
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
router.get('/inventory', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const { 
      search, 
      bloodGroup, 
      status, 
      expiry, 
      sortBy = 'expiryDate', 
      page = 1, 
      limit = 50 
    } = req.query;

    // Build filter query
    const filter = { bloodBankId };
    
    if (bloodGroup && bloodGroup !== 'all') {
      filter.bloodGroup = bloodGroup;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (expiry && expiry !== 'all') {
      const today = new Date();
      const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      if (expiry === 'expiring') {
        filter.expiryDate = { $lte: fourteenDaysFromNow, $gt: today };
        filter.status = { $in: ['available', 'reserved'] };
      } else if (expiry === 'expired') {
        filter.expiryDate = { $lte: today };
      }
    }
    
    if (search) {
      filter.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { firstSerialNumber: { $lte: parseInt(search) || 0 } },
        { lastSerialNumber: { $gte: parseInt(search) || 0 } }
      ];
    }

    // Build sort query
    let sort = {};
    switch (sortBy) {
      case 'expiryDate':
        sort = { expiryDate: 1 };
        break;
      case 'collectionDate':
        sort = { collectionDate: -1 };
        break;
      case 'bloodGroup':
        sort = { bloodGroup: 1, expiryDate: 1 };
        break;
      default:
        sort = { expiryDate: 1 };
    }

    const inventory = await BloodInventory.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donorId', 'userId')
      .populate('createdBy', 'name username');

    const total = await BloodInventory.countDocuments(filter);

    res.json({
      success: true,
      data: inventory,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
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
router.post('/inventory', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const {
      bloodGroup,
      donationType,
      firstSerialNumber,
      lastSerialNumber,
      collectionDate,
      expiryDate,
      donorId,
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
    if (parseInt(firstSerialNumber) > parseInt(lastSerialNumber)) {
      return res.status(400).json({
        success: false,
        message: 'First serial number must be less than or equal to last serial number'
      });
    }

    // Check for overlapping serial numbers
    const overlapping = await BloodInventory.findOne({
      bloodBankId,
      $or: [
        {
          firstSerialNumber: { $lte: parseInt(lastSerialNumber) },
          lastSerialNumber: { $gte: parseInt(firstSerialNumber) }
        }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Serial number range overlaps with existing inventory'
      });
    }

    const inventoryItem = new BloodInventory({
      bloodBankId,
      bloodGroup,
      donationType: donationType || 'whole_blood',
      firstSerialNumber: parseInt(firstSerialNumber),
      lastSerialNumber: parseInt(lastSerialNumber),
      collectionDate: new Date(collectionDate),
      expiryDate: new Date(expiryDate),
      donorId: donorId || null,
      donorName: donorName || '',
      status: status || 'available',
      location: location || '',
      temperature: temperature || '',
      notes: notes || '',
      createdBy: req.user.id
    });

    await inventoryItem.save();

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: inventoryItem
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
router.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bloodBankId = req.bloodBank._id;
    
    const inventoryItem = await BloodInventory.findOne({ _id: id, bloodBankId });
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'bloodGroup', 'donationType', 'firstSerialNumber', 'lastSerialNumber',
      'collectionDate', 'expiryDate', 'donorId', 'donorName', 'status',
      'location', 'temperature', 'notes'
    ];
    
    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate serial numbers if being updated
    if (updates.firstSerialNumber || updates.lastSerialNumber) {
      const firstSerial = parseInt(updates.firstSerialNumber || inventoryItem.firstSerialNumber);
      const lastSerial = parseInt(updates.lastSerialNumber || inventoryItem.lastSerialNumber);
      
      if (firstSerial > lastSerial) {
        return res.status(400).json({
          success: false,
          message: 'First serial number must be less than or equal to last serial number'
        });
      }

      // Check for overlapping serial numbers (excluding current item)
      const overlapping = await BloodInventory.findOne({
        _id: { $ne: id },
        bloodBankId,
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
    }

    updates.updatedBy = req.user.id;
    Object.assign(inventoryItem, updates);
    await inventoryItem.save();

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: inventoryItem
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
router.put('/inventory/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const bloodBankId = req.bloodBank._id;

    const validStatuses = ['available', 'reserved', 'used', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const inventoryItem = await BloodInventory.findOne({ _id: id, bloodBankId });
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    inventoryItem.status = status;
    inventoryItem.updatedBy = req.user.id;
    await inventoryItem.save();

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: inventoryItem
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
router.delete('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bloodBankId = req.bloodBank._id;
    
    const inventoryItem = await BloodInventory.findOne({ _id: id, bloodBankId });
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    await BloodInventory.findByIdAndDelete(id);

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
router.get('/expiry-alerts', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const today = new Date();
    const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const expiryAlerts = await BloodInventory.find({
      bloodBankId,
      status: { $in: ['available', 'reserved'] },
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
 * GET /api/store-manager/reports/inventory
 * Generate inventory report
 */
router.get('/reports/inventory', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const { format = 'json', bloodGroup, status, startDate, endDate } = req.query;

    // Build filter
    const filter = { bloodBankId };
    if (bloodGroup && bloodGroup !== 'all') filter.bloodGroup = bloodGroup;
    if (status && status !== 'all') filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const inventory = await BloodInventory.find(filter)
      .sort({ bloodGroup: 1, expiryDate: 1 })
      .populate('createdBy', 'name username');

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Blood Group', 'Type', 'First Serial', 'Last Serial', 'Units',
        'Collection Date', 'Expiry Date', 'Status', 'Location', 'Donor Name',
        'Created Date', 'Created By'
      ];
      
      const csvRows = [csvHeaders.join(',')];
      
      inventory.forEach(item => {
        const row = [
          item.bloodGroup,
          item.donationType,
          item.firstSerialNumber,
          item.lastSerialNumber,
          item.unitsCount,
          item.collectionDate.toISOString().split('T')[0],
          item.expiryDate.toISOString().split('T')[0],
          item.status,
          item.location || '',
          item.donorName || '',
          item.createdAt.toISOString().split('T')[0],
          item.createdBy?.name || ''
        ];
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.csv');
      res.send(csvRows.join('\n'));
    } else {
      res.json({
        success: true,
        data: inventory,
        summary: {
          totalItems: inventory.length,
          totalUnits: inventory.reduce((sum, item) => sum + item.unitsCount, 0),
          byStatus: inventory.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + item.unitsCount;
            return acc;
          }, {}),
          byBloodGroup: inventory.reduce((acc, item) => {
            acc[item.bloodGroup] = (acc[item.bloodGroup] || 0) + item.unitsCount;
            return acc;
          }, {})
        }
      });
    }
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report'
    });
  }
});

module.exports = router;