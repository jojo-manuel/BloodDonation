const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authMiddleware, requireBloodBankManager, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Booking = require('../models/Booking');

// Simple auth middleware (you should use your actual auth middleware)
const requireAuth = [authMiddleware, requireBloodBankManager];
const requireBookingAccess = [authMiddleware, requireRole(['bloodbank', 'BLOODBANK_ADMIN', 'store_manager', 'admin', 'bleeding_staff', 'doctor'])];

/**
 * GET /api/bloodbank-manager/analytics
 * Get dashboard analytics for blood bank manager
 */
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;

    // Get analytics data from database
    const totalBookings = await Booking.countDocuments({ hospital_id });
    const completedBookings = await Booking.countDocuments({ hospital_id, status: 'completed' });
    const totalPatients = await Patient.countDocuments({ hospital_id });
    const fulfilledPatients = await Patient.countDocuments({ hospital_id, isFulfilled: true });
    const pendingRequests = await Booking.countDocuments({ hospital_id, status: 'pending' });


    // Calculate time ranges
    const now = new Date();

    // Today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayStart.getDate() + 1);

    // This Week (last 7 days or current week) - let's do last 7 days for simplicity
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // This Month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Queries
    const todayBookingsCount = await Booking.countDocuments({
      hospital_id,
      date: { $gte: todayStart, $lt: todayEnd }
    });

    const weekBookingsCount = await Booking.countDocuments({
      hospital_id,
      date: { $gte: weekStart }
    });

    const monthBookingsCount = await Booking.countDocuments({
      hospital_id,
      date: { $gte: monthStart }
    });

    const monthPatientsCount = await Patient.countDocuments({
      hospital_id,
      createdAt: { $gte: monthStart }
    });

    // Structure expected by frontend
    const timeBased = {
      today: {
        bookings: todayBookingsCount
      },
      thisWeek: {
        bookings: weekBookingsCount
      },
      thisMonth: {
        bookings: monthBookingsCount,
        patients: monthPatientsCount,
        requests: 0 // Placeholder as donation requests aren't fully implemented
      }
    };


    // Blood group distribution
    const bloodGroupDistribution = await Patient.aggregate([
      { $match: { hospital_id } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Recent activity (last 10 bookings and patients)
    const recentBookings = await Booking.find({ hospital_id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('donorName patientName bloodGroup createdAt');

    const recentPatients = await Patient.find({ hospital_id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('patientName bloodGroup requiredUnits createdAt');

    const recentActivity = [
      ...recentBookings.map(booking => ({
        type: 'booking',
        description: `New booking: ${booking.donorName} for ${booking.patientName || 'Patient'} (${booking.bloodGroup})`,
        createdAt: booking.createdAt
      })),
      ...recentPatients.map(patient => ({
        type: 'patient',
        description: `New patient registered: ${patient.patientName} (${patient.bloodGroup}, ${patient.requiredUnits} units)`,
        createdAt: patient.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    const analytics = {
      overview: {
        totalBookings,
        completedBookings,
        totalPatients,
        fulfilledPatients,
        pendingRequests,
        todayBookings: todayBookingsCount
      },
      timeBased,
      bloodGroupDistribution,
      monthlyTrend: [],
      recentActivity
    };

    res.json({
      success: true,
      data: analytics
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
router.get('/bookings', requireBookingAccess, async (req, res) => {
  try {
    const { status, bloodGroup, search } = req.query;
    const hospital_id = req.user.hospital_id;

    // Build query
    let query = { hospital_id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (bloodGroup && bloodGroup !== 'all') {
      query.bloodGroup = bloodGroup;
    }

    if (req.query.date) {
      const searchDate = new Date(req.query.date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.date = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    if (search) {
      query.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { tokenNumber: { $regex: search, $options: 'i' } }, // Added token search
        { patientName: { $regex: search, $options: 'i' } },
        { patientMRID: { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('donorId', 'name email');

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: 1,
        pages: 1,
        total: bookings.length
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
router.put('/bookings/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = {
      status,
      updatedBy: req.user.id
    };

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

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
router.get('/patients', requireAuth, async (req, res) => {
  try {
    const { bloodGroup, search, fulfilled } = req.query;
    const hospital_id = req.user.hospital_id;

    // Build query
    let query = { hospital_id };

    if (bloodGroup && bloodGroup !== 'all') {
      query.bloodGroup = bloodGroup;
    }

    if (fulfilled !== undefined) {
      query.isFulfilled = fulfilled === 'true';
    }

    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { mrid: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: patients,
      pagination: {
        current: 1,
        pages: 1,
        total: patients.length
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
router.post('/patients', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
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
    const existingPatient = await Patient.findOne({ mrid: mrid.toUpperCase() });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this MRID already exists'
      });
    }

    const newPatient = new Patient({
      patientName: name,
      address,
      bloodGroup,
      mrid: mrid.toUpperCase(),
      phoneNumber,
      requiredUnits: parseInt(unitsRequired),
      requiredDate: new Date(dateNeeded),
      hospital_id,
      createdBy: req.user.id
    });

    await newPatient.save();

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: newPatient
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
 * GET /api/bloodbank-manager/staff
 * Get all staff members for the blood bank
 */
router.get('/staff', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;

    const staff = await User.find({
      hospital_id,
      role: { $in: ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'centrifuge_staff', 'store_manager'] }
    }).select('-password').sort({ createdAt: -1 });

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

// Helper function to generate username
const generateUsername = (name) => {
  const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
  return baseUsername + Math.random().toString(36).substr(2, 4);
};

// Helper function to generate password
const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

/**
 * POST /api/bloodbank-manager/staff
 * Create a new staff member
 */
router.post('/staff', requireAuth, async (req, res) => {
  try {
    const { name, role, email, phone } = req.body;
    const hospital_id = req.user.hospital_id;
    const createdBy = req.user.id;

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

    // Generate credentials
    const username = generateUsername(name);
    const password = generatePassword();

    // Create new user
    const newUser = new User({
      username,
      email: email || `${username}@${hospital_id}.com`,
      name,
      role,
      phone,
      hospital_id,
      createdBy,
      isActive: true
    });

    // Hash password
    newUser.password = await newUser.hashPassword(password);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      },
      credentials: {
        username,
        password
      }
    });
  } catch (error) {
    console.error('Staff creation error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or username already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create staff member'
    });
  }
});

/**
 * PUT /api/bloodbank-manager/staff/:id
 * Update a staff member
 */
router.put('/staff/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedUpdates = ['name', 'email', 'phone', 'role', 'isActive'];
    const filteredUpdates = {};

    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    filteredUpdates.updatedBy = req.user.id;

    const updatedStaff = await User.findByIdAndUpdate(id, filteredUpdates, { new: true }).select('-password');

    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff
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
 * POST /api/bloodbank-manager/staff/:id/reset-password
 * Reset staff member password
 */
router.post('/staff/:id/reset-password', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Generate new password
    const newPassword = generatePassword();

    // Hash password
    user.password = await user.hashPassword(newPassword);
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        _id: user._id,
        email: user.email,
        username: user.username,
        newPassword
      }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

/**
 * DELETE /api/bloodbank-manager/staff/:id
 * Delete a staff member
 */
router.delete('/staff/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStaff = await User.findByIdAndDelete(id);

    if (!deletedStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

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
 * GET /api/bloodbank-manager/details
 * Get blood bank details
 */
router.get('/details', requireAuth, (req, res) => {
  try {
    const bloodBank = req.bloodBank;

    res.json({
      success: true,
      data: {
        id: bloodBank._id,
        name: bloodBank.name,
        hospitalName: req.user.hospital_id,
        address: '123 Hospital Street, Test City',
        phone: '1234567890',
        email: 'info@hospital.com',
        status: 'approved'
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

/**
 * GET /api/bloodbank-manager/donation-requests
 * Get all donation requests
 */
router.get('/donation-requests', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;

    // For now, return empty array as this feature isn't implemented yet
    res.json({
      success: true,
      data: [],
      pagination: {
        current: 1,
        pages: 1,
        total: 0
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
 * Get blood inventory
 */
router.get('/inventory', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;

    // For now, return empty array as this feature isn't implemented yet
    res.json({
      success: true,
      data: [],
      pagination: {
        current: 1,
        pages: 1,
        total: 0
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
 * GET /api/bloodbank-manager/donors
 * Get all donors registered with the blood bank
 */
router.get('/donors', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;

    const donors = await User.find({
      hospital_id,
      role: { $in: ['DONOR', 'user'] }
    }).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: donors,
      pagination: {
        current: 1,
        pages: 1,
        total: donors.length
      }
    });
  } catch (error) {
    console.error('Donors fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donors'
    });
  }
});

/**
 * GET /api/bloodbank-manager/visited-donors
 * Get donors who have visited (booked)
 */
router.get('/visited-donors', requireAuth, async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;

    // Find all bookings for this hospital where donorId exists
    const bookings = await Booking.find({
      hospital_id,
      donorId: { $ne: null }
    })
      .populate('donorId', 'name email phone bloodGroup address isBlocked isSuspended warningMessage')
      .sort({ date: -1 });

    const donorsMap = new Map();

    bookings.forEach(booking => {
      // Safety check: if populated donor is null (deleted user?), skip
      if (!booking.donorId) return;

      const donorIdStr = booking.donorId._id.toString();

      if (!donorsMap.has(donorIdStr)) {
        donorsMap.set(donorIdStr, {
          donor: booking.donorId,
          visits: [],
          totalVisits: 0,
          completedDonations: 0,
          pendingBookings: 0,
          lastVisit: null
        });
      }

      const donorStats = donorsMap.get(donorIdStr);

      // Add visit details
      donorStats.visits.push({
        bookingId: booking._id,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        tokenNumber: booking.tokenNumber,
        patientName: booking.patientName,
        patientMRID: booking.patientMRID,
        arrived: booking.arrived, // Will be undefined if not in schema, handling safely
        completedAt: booking.completedAt,
        rejectionReason: booking.notes // Using notes as rejection reason proxy if needed, or undefined
      });

      // Update stats
      donorStats.totalVisits++;
      if (booking.status === 'completed') {
        donorStats.completedDonations++;
      } else if (booking.status === 'pending' || booking.status === 'confirmed') {
        donorStats.pendingBookings++;
      }

      // Update last visit (bookings are sorted by date desc, so first one is latest)
      if (!donorStats.lastVisit) {
        donorStats.lastVisit = booking.date;
      }
    });

    const donorsData = Array.from(donorsMap.values());

    res.json({
      success: true,
      data: donorsData,
      pagination: {
        current: 1,
        pages: 1,
        total: donorsData.length
      }
    });
  } catch (error) {
    console.error('Visited donors fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visited donors'
    });
  }
});


/**
 * GET /api/bloodbank-manager/users
 * Get all users (non-staff, non-donor specific view)
 */
router.get('/users', requireAuth, async (req, res) => {
  try {
    const { username, email, role, date } = req.query;
    const hospital_id = req.user.hospital_id;

    let query = { hospital_id };

    // If role is specified, use it. Otherwise default to 'user' role
    if (role && role !== 'all') {
      query.role = role;
    } else if (!role) {
      query.role = 'user';
    }

    // Filter by date if provided
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.createdAt = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    // Filter by name/email/username using regex
    if (username) {
      query.$or = [
        { username: { $regex: username, $options: 'i' } },
        { name: { $regex: username, $options: 'i' } },
        { email: { $regex: username, $options: 'i' } }
      ];
    } else if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
      pagination: {
        current: 1,
        pages: 1,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/bloodbank-manager/bookings/token/:tokenNumber
 * Get booking by token number
 */
router.get('/bookings/token/:tokenNumber', requireBookingAccess, async (req, res) => {
  try {
    const { tokenNumber } = req.params;
    const hospital_id = req.user.hospital_id;

    const booking = await Booking.findOne({
      tokenNumber: { $regex: new RegExp(`^${tokenNumber}$`, 'i') },
      hospital_id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Booking token lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find booking'
    });
  }
});



/**
 * POST /api/bloodbank-manager/users
 * Create a new user
 */
router.post('/users', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, role, bloodGroup } = req.body;
    const hospital_id = req.user.hospital_id;
    const createdBy = req.user.id;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate credentials
    const username = generateUsername(name);
    const password = generatePassword();

    // Create new user
    const newUser = new User({
      username,
      email,
      name,
      role: role || 'user',
      phone,
      hospital_id,
      createdBy,
      isActive: true,
      // Add bloodGroup to user model if it exists in schema, otherwise ignoring it
      // Note: User schema in provided code doesn't explicitly show bloodGroup but it might differ in actual DB
      // or we might need to add it to User schema if essential.
      // For now, assuming it might be stored only on Patient/Donor or using flex schema
    });

    // If it's a donor, they might need bloodGroup in User profile if Schema allows
    // Checking previous User schema view: it doesn't have bloodGroup. 
    // Usually donors have a separate Donor profile or extended User profile.
    // For now we just create the User account.

    // Hash password
    newUser.password = await newUser.hashPassword(password);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt
        },
        credentials: {
          email,
          password
        }
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/bloodbank-manager/users/:id/status
 * Update user status (block/suspend)
 */
router.put('/users/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked, isSuspended, warningMessage } = req.body;

    const updates = {};
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;
    if (isSuspended !== undefined) updates.isSuspended = isSuspended;
    // warningMessage logic would go here if User model supported it, 
    // or we might send an email notification. 
    // For now, we update flags.

    updates.updatedBy = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

/**
 * PUT /api/bloodbank-manager/donors/:id/status
 * Update donor status (reuse user status logic)
 */
router.put('/donors/:id/status', requireAuth, async (req, res) => {
  // Re-using the same logic as users for now, as donors are users
  try {
    const { id } = req.params;
    const { isBlocked, isSuspended, warningMessage } = req.body;

    const updates = {};
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;
    if (isSuspended !== undefined) updates.isSuspended = isSuspended;

    updates.updatedBy = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    res.json({
      success: true,
      message: 'Donor status updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Donor status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donor status'
    });
  }
});

module.exports = router;