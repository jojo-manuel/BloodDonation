const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const BloodBank = require('../Models/BloodBank');
const Patient = require('../Models/Patient');
const Booking = require('../Models/Booking');
const DonationRequest = require('../Models/DonationRequest');
const User = require('../Models/User');
const Donor = require('../Models/donor');
const bcrypt = require('bcryptjs');

// Middleware to ensure user is a blood bank manager
const requireBloodBankManager = async (req, res, next) => {
  try {
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank manager role required.'
      });
    }

    // Get blood bank details for the user
    const bloodBank = await BloodBank.findOne({ userId: req.user.id });
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found for this user'
      });
    }

    req.bloodBank = bloodBank;
    next();
  } catch (error) {
    console.error('Blood bank manager middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Apply authentication and blood bank manager middleware to all routes
router.use(authMiddleware);
router.use(requireBloodBankManager);

/**
 * GET /api/bloodbank-manager/analytics
 * Get dashboard analytics for blood bank manager
 */
router.get('/analytics', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get overview statistics
    const [
      totalBookings,
      completedBookings,
      totalPatients,
      fulfilledPatients,
      pendingRequests,
      todayBookings
    ] = await Promise.all([
      Booking.countDocuments({ bloodBankId }),
      Booking.countDocuments({ bloodBankId, status: 'completed' }),
      Patient.countDocuments({ bloodBankId, isDeleted: false }),
      Patient.countDocuments({ bloodBankId, isFulfilled: true, isDeleted: false }),
      DonationRequest.countDocuments({ bloodBankId, status: 'pending' }),
      Booking.countDocuments({ 
        bloodBankId, 
        date: { $gte: startOfToday, $lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get blood group distribution from patients
    const bloodGroupDistribution = await Patient.aggregate([
      { $match: { bloodBankId, isDeleted: false } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get monthly trend data (last 6 months)
    const monthlyTrend = await Booking.aggregate([
      {
        $match: {
          bloodBankId,
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookings: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get recent activity (last 10 activities)
    const recentBookings = await Booking.find({ bloodBankId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('donorName patientName status createdAt bloodGroup');

    const recentPatients = await Patient.find({ bloodBankId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name bloodGroup unitsRequired createdAt');

    const recentActivity = [
      ...recentBookings.map(booking => ({
        type: 'booking',
        description: `New booking: ${booking.donorName} for ${booking.patientName} (${booking.bloodGroup})`,
        createdAt: booking.createdAt
      })),
      ...recentPatients.map(patient => ({
        type: 'patient',
        description: `New patient registered: ${patient.name} (${patient.bloodGroup}, ${patient.unitsRequired} units)`,
        createdAt: patient.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          completedBookings,
          totalPatients,
          fulfilledPatients,
          pendingRequests,
          todayBookings
        },
        bloodGroupDistribution,
        monthlyTrend,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

/**
 * GET /api/bloodbank-manager/bookings
 * Get all bookings for the blood bank with filtering
 */
router.get('/bookings', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const { status, bloodGroup, search, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Build filter query
    const filter = { bloodBankId };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (bloodGroup && bloodGroup !== 'all') {
      filter.bloodGroup = bloodGroup;
    }
    
    if (search) {
      filter.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { patientMRID: { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donorId', 'userId')
      .populate('bloodBankId', 'name');

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

/**
 * PUT /api/bloodbank-manager/bookings/:id/status
 * Update booking status
 */
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const bloodBankId = req.bloodBank._id;

    const validStatuses = ['pending', 'confirmed', 'completed', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await Booking.findOne({ _id: id, bloodBankId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    if (status === 'completed') {
      booking.completedAt = new Date();
    }

    await booking.save();

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: booking
    });
  } catch (error) {
    console.error('Booking status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

/**
 * GET /api/bloodbank-manager/patients
 * Get all patients for the blood bank
 */
router.get('/patients', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const { bloodGroup, search, fulfilled, page = 1, limit = 50 } = req.query;

    // Build filter query
    const filter = { bloodBankId, isDeleted: false };
    
    if (bloodGroup && bloodGroup !== 'all') {
      filter.bloodGroup = bloodGroup;
    }
    
    if (fulfilled !== undefined) {
      filter.isFulfilled = fulfilled === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mrid: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(filter);

    res.json({
      success: true,
      data: patients,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Patients fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients'
    });
  }
});

/**
 * POST /api/bloodbank-manager/patients
 * Create a new patient
 */
router.post('/patients', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const bloodBankName = req.bloodBank.name;
    
    const {
      name,
      address,
      bloodGroup,
      mrid,
      phoneNumber,
      unitsRequired,
      dateNeeded
    } = req.body;

    // Validate required fields
    if (!name || !bloodGroup || !mrid || !phoneNumber || !unitsRequired || !dateNeeded) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if MRID already exists
    const existingPatient = await Patient.findOne({ mrid: mrid.toUpperCase(), isDeleted: false });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this MRID already exists'
      });
    }

    // Check if phone number already exists
    const existingPhone = await Patient.findOne({ phoneNumber, isDeleted: false });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this phone number already exists'
      });
    }

    const patient = new Patient({
      bloodBankId,
      bloodBankName,
      name,
      address,
      bloodGroup,
      mrid: mrid.toUpperCase(),
      phoneNumber,
      unitsRequired: parseInt(unitsRequired),
      dateNeeded: new Date(dateNeeded)
    });

    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    console.error('Patient creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create patient'
    });
  }
});

/**
 * PUT /api/bloodbank-manager/patients/:id
 * Update a patient
 */
router.put('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bloodBankId = req.bloodBank._id;
    
    const patient = await Patient.findOne({ _id: id, bloodBankId, isDeleted: false });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'address', 'bloodGroup', 'phoneNumber', 'unitsRequired', 'dateNeeded', 'unitsReceived'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    Object.assign(patient, updates);
    await patient.save();

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Patient update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient'
    });
  }
});

/**
 * DELETE /api/bloodbank-manager/patients/:id
 * Soft delete a patient
 */
router.delete('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bloodBankId = req.bloodBank._id;
    
    const patient = await Patient.findOne({ _id: id, bloodBankId, isDeleted: false });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    patient.isDeleted = true;
    await patient.save();

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Patient deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient'
    });
  }
});

/**
 * GET /api/bloodbank-manager/staff
 * Get all staff members for the blood bank
 */
router.get('/staff', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;

    const staff = await User.find({ 
      bloodBankId,
      role: { $in: ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'centrifuge_staff', 'store_manager'] }
    }).select('-password -resetPasswordToken -resetPasswordExpires');

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

/**
 * POST /api/bloodbank-manager/staff
 * Create a new staff member
 */
router.post('/staff', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const { name, role, email, phone } = req.body;

    // Validate required fields
    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name and role are required'
      });
    }

    // Validate role
    const validRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'centrifuge_staff', 'store_manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Generate username and password
    const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    let username = baseUsername;
    let counter = 1;
    
    // Ensure unique username
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 12);

    const staff = new User({
      username,
      name,
      email: email || null,
      password: hashedPassword,
      role,
      bloodBankId,
      provider: 'local'
    });

    await staff.save();

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: {
        id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        email: staff.email,
        phone: staff.phone
      },
      credentials: {
        username,
        password
      }
    });
  } catch (error) {
    console.error('Staff creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member'
    });
  }
});

/**
 * PUT /api/bloodbank-manager/staff/:id
 * Update a staff member
 */
router.put('/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bloodBankId = req.bloodBank._id;
    
    const staff = await User.findOne({ _id: id, bloodBankId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'email', 'phone', 'role'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    Object.assign(staff, updates);
    await staff.save();

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: {
        id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        email: staff.email,
        phone: staff.phone
      }
    });
  } catch (error) {
    console.error('Staff update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff member'
    });
  }
});

/**
 * DELETE /api/bloodbank-manager/staff/:id
 * Delete a staff member
 */
router.delete('/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bloodBankId = req.bloodBank._id;
    
    const staff = await User.findOne({ _id: id, bloodBankId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Staff deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff member'
    });
  }
});

/**
 * GET /api/bloodbank-manager/donation-requests
 * Get all donation requests for the blood bank
 */
router.get('/donation-requests', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;
    const { status, bloodGroup, page = 1, limit = 50 } = req.query;

    // Build filter query
    const filter = { bloodBankId };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (bloodGroup && bloodGroup !== 'all') {
      filter.bloodGroup = bloodGroup;
    }

    const requests = await DonationRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donorId', 'userId')
      .populate('patientId', 'name mrid')
      .populate('requesterId', 'name username');

    const total = await DonationRequest.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Donation requests fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation requests'
    });
  }
});

/**
 * GET /api/bloodbank-manager/inventory
 * Get blood inventory for the blood bank
 */
router.get('/inventory', async (req, res) => {
  try {
    const bloodBankId = req.bloodBank._id;

    // This is a placeholder - you'll need to implement actual inventory tracking
    // For now, we'll return mock data based on completed donations
    const completedDonations = await Booking.aggregate([
      { $match: { bloodBankId, status: 'completed' } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const inventory = completedDonations.map(item => ({
      bloodGroup: item._id,
      unitsAvailable: item.count,
      unitsReserved: 0,
      expiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
      lastUpdated: new Date()
    }));

    res.json({
      success: true,
      data: inventory
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
 * GET /api/bloodbank-manager/details
 * Get blood bank details
 */
router.get('/details', async (req, res) => {
  try {
    const bloodBank = req.bloodBank;
    
    res.json({
      success: true,
      data: {
        id: bloodBank._id,
        name: bloodBank.name,
        hospitalName: bloodBank.hospitalName,
        address: bloodBank.address,
        phone: bloodBank.phone,
        email: bloodBank.email,
        status: bloodBank.status
      }
    });
  } catch (error) {
    console.error('Blood bank details fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood bank details'
    });
  }
});

module.exports = router;