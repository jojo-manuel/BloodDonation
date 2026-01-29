const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const BloodBag = require('../models/BloodBag');
const BloodComponent = require('../models/BloodComponent');

// Middleware for centrifuge staff authorization
const requireCentrifugeStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!['centrifuge_staff', 'store_manager', 'bloodbank', 'BLOODBANK_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Centrifuge staff role required.'
    });
  }

  next();
};

const requireAuth = [authMiddleware, requireCentrifugeStaff];

/**
 * GET /api/centrifuge-staff/blood-bags
 * Get all blood bags for centrifuge processing
 */
router.get('/blood-bags', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const { 
      search, 
      bloodGroup, 
      status, 
      sortBy = 'receivedAt',
      sortOrder = 'desc'
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
        { serialNumber: { $regex: search, $options: 'i' } },
        { donorName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    let sort = {};
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    sort[sortBy] = sortDirection;

    const bloodBags = await BloodBag.find(query)
      .sort(sort)
      .populate('receivedBy', 'name')
      .populate('separatedBy', 'name');

    // Add components count for each bag
    const bagsWithComponentCount = await Promise.all(
      bloodBags.map(async (bag) => {
        const componentsCount = await BloodComponent.countDocuments({ originalBagId: bag._id });
        return {
          ...bag.toObject(),
          componentsCount
        };
      })
    );

    res.json({
      success: true,
      data: bagsWithComponentCount,
      pagination: {
        current: 1,
        pages: 1,
        total: bagsWithComponentCount.length
      }
    });
  } catch (error) {
    console.error('Centrifuge staff blood bags fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood bags'
    });
  }
});

/**
 * POST /api/centrifuge-staff/blood-bags
 * Receive a new blood bag for processing
 */
router.post('/blood-bags', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const {
      serialNumber,
      bloodGroup,
      donorName,
      collectionDate,
      volume,
      notes
    } = req.body;

    // Validate required fields
    if (!serialNumber || !bloodGroup || !collectionDate) {
      return res.status(400).json({
        success: false,
        message: 'Serial number, blood group, and collection date are required'
      });
    }

    // Check if serial number already exists
    const existingBag = await BloodBag.findOne({ serialNumber: serialNumber.toUpperCase() });
    if (existingBag) {
      return res.status(400).json({
        success: false,
        message: 'Blood bag with this serial number already exists'
      });
    }

    // Validate collection date (should not be in the future)
    const collectionDateObj = new Date(collectionDate);
    if (collectionDateObj > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Collection date cannot be in the future'
      });
    }

    const newBloodBag = new BloodBag({
      serialNumber: serialNumber.toUpperCase(),
      bloodGroup,
      donorName: donorName || '',
      collectionDate: collectionDateObj,
      volume: volume || 450,
      notes: notes || '',
      hospital_id,
      receivedBy: req.user.id,
      receivedAt: new Date(),
      status: 'received',
      createdBy: req.user.id
    });

    await newBloodBag.save();

    // Populate the created bag
    await newBloodBag.populate('receivedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Blood bag received successfully',
      data: newBloodBag
    });
  } catch (error) {
    console.error('Centrifuge staff blood bag creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to receive blood bag'
    });
  }
});

/**
 * PUT /api/centrifuge-staff/blood-bags/:id
 * Update a blood bag
 */
router.put('/blood-bags/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const hospital_id = req.user.hospital_id;

    // Find the bag first to ensure it belongs to the hospital
    const bag = await BloodBag.findOne({ _id: id, hospital_id });
    if (!bag) {
      return res.status(404).json({
        success: false,
        message: 'Blood bag not found'
      });
    }

    // Add metadata
    updates.updatedBy = req.user.id;

    const updatedBag = await BloodBag.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('receivedBy separatedBy', 'name');

    res.json({
      success: true,
      message: 'Blood bag updated successfully',
      data: updatedBag
    });
  } catch (error) {
    console.error('Centrifuge staff blood bag update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blood bag'
    });
  }
});

/**
 * POST /api/centrifuge-staff/blood-bags/:id/separate
 * Separate a blood bag into components
 */
router.post('/blood-bags/:id/separate', requireAuth, async (req, res) => {
  console.log('=== SEPARATION ROUTE CALLED ===');
  console.log('Request params:', req.params);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User:', req.user);
  
  try {
    const { id } = req.params;
    const {
      components,
      separationDate,
      technician,
      method,
      notes
    } = req.body;
    const hospital_id = req.user.hospital_id;

    // Validate required fields
    if (!components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one component is required'
      });
    }

    if (!separationDate || !technician || !method) {
      return res.status(400).json({
        success: false,
        message: 'Separation date, technician, and method are required'
      });
    }

    console.log('Starting separation process for bag ID:', id);
    console.log('Separation request data:', req.body);

    // Find the blood bag
    const bloodBag = await BloodBag.findOne({ _id: id, hospital_id });
    if (!bloodBag) {
      return res.status(404).json({
        success: false,
        message: 'Blood bag not found'
      });
    }

    console.log('Found blood bag:', bloodBag.serialNumber);

    // Check if bag can be separated
    if (bloodBag.status !== 'received' && bloodBag.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Blood bag cannot be separated in its current status'
      });
    }

    // Validate separation date
    const separationDateObj = new Date(separationDate);
    if (separationDateObj < bloodBag.collectionDate) {
      return res.status(400).json({
        success: false,
        message: 'Separation date cannot be before collection date'
      });
    }

    if (separationDateObj > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Separation date cannot be in the future'
      });
    }

    // Validate total volume doesn't exceed bag volume
    const totalComponentVolume = components.reduce((sum, comp) => sum + parseInt(comp.volume || 0), 0);
    if (totalComponentVolume > bloodBag.volume) {
      return res.status(400).json({
        success: false,
        message: `Total component volume (${totalComponentVolume}ml) exceeds bag volume (${bloodBag.volume}ml)`
      });
    }

    // Check for duplicate serial numbers
    const serialNumbers = components.map(comp => comp.serialNumber?.toUpperCase()).filter(Boolean);
    const uniqueSerials = [...new Set(serialNumbers)];
    if (serialNumbers.length !== uniqueSerials.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate serial numbers found in components'
      });
    }

    // Check if any serial numbers already exist
    for (const serial of serialNumbers) {
      const existingComponent = await BloodComponent.findOne({ serialNumber: serial });
      if (existingComponent) {
        return res.status(400).json({
          success: false,
          message: `Component with serial number ${serial} already exists`
        });
      }
    }

    console.log('All validations passed, starting component creation...');

    // Create components
    const createdComponents = [];
    for (const componentData of components) {
      if (!componentData.volume || !componentData.serialNumber) {
        continue; // Skip incomplete components
      }

      console.log('Processing component:', componentData.type, componentData.serialNumber);

      // Calculate expiry date based on component type
      let expiryDays;
      switch (componentData.type) {
        case 'red_cells':
          expiryDays = 42; // 42 days for red blood cells
          break;
        case 'plasma':
          expiryDays = 365; // 1 year for frozen plasma
          break;
        case 'platelets':
          expiryDays = 5; // 5 days for platelets
          break;
        case 'white_cells':
          expiryDays = 1; // 24 hours for white blood cells
          break;
        case 'cryoprecipitate':
          expiryDays = 365; // 1 year for frozen cryoprecipitate
          break;
        default:
          expiryDays = 35; // Default
      }
      
      const expiryDate = new Date(separationDateObj.getTime() + (expiryDays * 24 * 60 * 60 * 1000));

      console.log('Creating component with data:', {
        serialNumber: componentData.serialNumber.toUpperCase(),
        type: componentData.type,
        bloodGroup: bloodBag.bloodGroup,
        volume: parseInt(componentData.volume),
        originalBagId: bloodBag._id,
        originalBagSerial: bloodBag.serialNumber,
        separationDate: separationDateObj,
        separatedBy: req.user.id,
        separationMethod: method,
        expiryDate: expiryDate,
        hospital_id,
        notes: componentData.notes || '',
        createdBy: req.user.id
      });

      const component = new BloodComponent({
        serialNumber: componentData.serialNumber.toUpperCase(),
        type: componentData.type,
        bloodGroup: bloodBag.bloodGroup,
        volume: parseInt(componentData.volume),
        originalBagId: bloodBag._id,
        originalBagSerial: bloodBag.serialNumber,
        separationDate: separationDateObj,
        separatedBy: req.user.id,
        separationMethod: method,
        expiryDate: expiryDate,
        hospital_id,
        notes: componentData.notes || '',
        createdBy: req.user.id
      });

      await component.save();
      await component.populate('separatedBy originalBagId', 'name serialNumber');
      createdComponents.push(component);
    }

    // Update blood bag status
    const bagUpdateData = {
      status: 'separated',
      separatedAt: separationDateObj,
      separatedBy: req.user.id,
      separationMethod: method,
      componentsCount: createdComponents.length,
      updatedBy: req.user.id
    };

    // Add separation notes
    const separationNote = `Separated into ${createdComponents.length} components by ${technician} using ${method}`;
    bagUpdateData.notes = bloodBag.notes ? `${bloodBag.notes}\n${separationNote}` : separationNote;
    
    if (notes) {
      bagUpdateData.notes += `\nSeparation notes: ${notes}`;
    }

    await BloodBag.findByIdAndUpdate(id, bagUpdateData);

    res.json({
      success: true,
      message: `Blood bag separated into ${createdComponents.length} components successfully`,
      data: {
        bloodBag: { ...bloodBag.toObject(), ...bagUpdateData },
        components: createdComponents
      }
    });
  } catch (error) {
    console.error('Centrifuge staff separation error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      errors: error.errors,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to separate blood bag',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/centrifuge-staff/components
 * Get all blood components
 */
router.get('/components', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const { 
      search, 
      bloodGroup, 
      type,
      status,
      sortBy = 'separationDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { hospital_id };
    
    if (bloodGroup && bloodGroup !== 'all') {
      query.bloodGroup = bloodGroup;
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { serialNumber: { $regex: search, $options: 'i' } },
        { originalBagSerial: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    let sort = {};
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    sort[sortBy] = sortDirection;

    const components = await BloodComponent.find(query)
      .sort(sort)
      .populate('separatedBy', 'name')
      .populate('originalBagId', 'serialNumber bloodGroup collectionDate');

    res.json({
      success: true,
      data: components,
      pagination: {
        current: 1,
        pages: 1,
        total: components.length
      }
    });
  } catch (error) {
    console.error('Centrifuge staff components fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch components'
    });
  }
});

/**
 * PUT /api/centrifuge-staff/components/:id
 * Update a blood component
 */
router.put('/components/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const hospital_id = req.user.hospital_id;

    // Find the component first to ensure it belongs to the hospital
    const component = await BloodComponent.findOne({ _id: id, hospital_id });
    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Blood component not found'
      });
    }

    // Add metadata
    updates.updatedBy = req.user.id;

    const updatedComponent = await BloodComponent.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('separatedBy originalBagId', 'name serialNumber');

    res.json({
      success: true,
      message: 'Blood component updated successfully',
      data: updatedComponent
    });
  } catch (error) {
    console.error('Centrifuge staff component update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blood component'
    });
  }
});

/**
 * GET /api/centrifuge-staff/analytics
 * Get analytics for centrifuge staff
 */
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Blood bags analytics
    const totalBags = await BloodBag.countDocuments({ hospital_id });
    const receivedBags = await BloodBag.countDocuments({ hospital_id, status: 'received' });
    const separatedBags = await BloodBag.countDocuments({ hospital_id, status: 'separated' });
    const processingBags = await BloodBag.countDocuments({ hospital_id, status: 'processing' });

    // Components analytics
    const totalComponents = await BloodComponent.countDocuments({ hospital_id });
    const availableComponents = await BloodComponent.countDocuments({ hospital_id, status: 'available' });
    const usedComponents = await BloodComponent.countDocuments({ hospital_id, status: 'used' });

    // Recent activity
    const recentSeparations = await BloodBag.find({
      hospital_id,
      status: 'separated',
      separatedAt: { $gte: sevenDaysAgo }
    }).sort({ separatedAt: -1 }).limit(10);

    // Component type distribution
    const componentTypeDistribution = await BloodComponent.aggregate([
      { $match: { hospital_id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Blood group distribution
    const bloodGroupDistribution = await BloodBag.aggregate([
      { $match: { hospital_id } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalBags,
          receivedBags,
          separatedBags,
          processingBags,
          totalComponents,
          availableComponents,
          usedComponents
        },
        componentTypeDistribution,
        bloodGroupDistribution,
        recentActivity: recentSeparations
      }
    });
  } catch (error) {
    console.error('Centrifuge staff analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

/**
 * GET /api/centrifuge-staff/expiry-alerts
 * Get components expiring soon
 */
router.get('/expiry-alerts', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiryAlerts = await BloodComponent.find({
      hospital_id,
      status: 'available',
      expiryDate: { $lte: sevenDaysFromNow, $gt: today }
    }).sort({ expiryDate: 1 }).populate('originalBagId', 'serialNumber');

    res.json({
      success: true,
      data: expiryAlerts
    });
  } catch (error) {
    console.error('Centrifuge staff expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiry alerts'
    });
  }
});

module.exports = router;