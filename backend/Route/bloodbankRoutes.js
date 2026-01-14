// Route/bloodbankRoutes.js
// Routes for blood bank operations

const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const BloodBank = require('../Models/BloodBank');
const Donor = require('../Models/donor');
const User = require('../Models/User');
const Booking = require('../Models/Booking');
const DonationRequest = require('../Models/DonationRequest');

/**
 * Register a new blood bank (public endpoint - no auth required)
 * POST /api/bloodbank/register
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      hospitalName,
      pincode,
      localBody,
      district,
      state,
      phone,
      userId
    } = req.body;

    // Validate required fields
    if (!name || !hospitalName || !pincode || !localBody || !district || !state || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, hospitalName, pincode, localBody, district, state, phone'
      });
    }

    // Validate pincode format
    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must be a valid 6-digit number'
      });
    }

    // Validate phone format
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be a valid 10-digit Indian number'
      });
    }

    // Check if user exists (if userId provided)
    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if blood bank already exists for this user
      const existingBloodBank = await BloodBank.findOne({ userId });
      if (existingBloodBank) {
        return res.status(400).json({
          success: false,
          message: 'Blood bank already registered for this user'
        });
      }
    }

    // Create address string from components
    const address = `${localBody}, ${district}, ${state} - ${pincode}`;

    // Create new blood bank with pending status
    const bloodBank = new BloodBank({
      userId: userId || null,
      name,
      hospitalName,
      address,
      pincode,
      localBody,
      district,
      state,
      phone,
      status: 'pending' // Always set to pending for admin approval
    });

    await bloodBank.save();

    res.status(201).json({
      success: true,
      message: 'Blood bank registration submitted successfully. Waiting for admin approval.',
      data: {
        id: bloodBank._id,
        name: bloodBank.name,
        hospitalName: bloodBank.hospitalName,
        status: bloodBank.status
      }
    });
  } catch (error) {
    console.error('Error registering blood bank:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering blood bank',
      error: error.message
    });
  }
});

/**
 * Get all blood banks (public/auth) for dropdown
 * GET /api/bloodbank/all
 */
router.get('/all', async (req, res) => {
  try {
    const bloodBanks = await BloodBank.find().select('name hospitalName address district state pincode phone status');
    res.json({ success: true, count: bloodBanks.length, data: bloodBanks });
  } catch (error) {
    console.error('Error fetching blood banks:', error);
    res.status(500).json({ success: false, message: 'Error fetching blood banks' });
  }
});


/**
 * Get blood bank details for the authenticated user
 * GET /api/bloodbank/details
 */
router.get('/details', authMiddleware, async (req, res) => {
  try {
    const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];
    if (req.user.role !== 'bloodbank' && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank or staff role required.'
      });
    }

    let bloodBank;
    if (req.user.role === 'bloodbank') {
      bloodBank = await BloodBank.findOne({ userId: req.user.id }).populate('userId', 'name email username');
    } else {
      bloodBank = await BloodBank.findById(req.user.bloodBankId).populate('userId', 'name email username');
    }

    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank details not found. Please complete your registration.'
      });
    }

    res.json({
      success: true,
      data: bloodBank
    });
  } catch (error) {
    console.error('Error fetching blood bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blood bank details',
      error: error.message
    });
  }
});

/**
 * Get all donors (for blood bank to search/view)
 * GET /api/bloodbank/donors
 */
router.get('/donors', authMiddleware, async (req, res) => {
  try {
    // Verify user is a bloodbank
    // Verify user is a bloodbank or staff
    const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];
    if (req.user.role !== 'bloodbank' && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank or staff role required.'
      });
    }

    // Get all donors with user information
    const donors = await Donor.find()
      .populate('userId', 'name email username phone')
      .lean();

    // Format donor data for frontend
    const formattedDonors = donors.map(donor => ({
      _id: donor._id,
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      email: donor.userId?.email || donor.email,
      phone: donor.contactNumber || donor.userId?.phone,
      address: donor.houseAddress || donor.address,
      lastDonationDate: donor.lastDonatedDate,
      availability: donor.availability,
      isBlocked: donor.isBlocked || false,
      isSuspended: donor.isSuspended || false,
      warningMessage: donor.warningMessage || null,
      userId: donor.userId
    }));

    res.json({
      success: true,
      data: formattedDonors
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donors',
      error: error.message
    });
  }
});

/**
 * Get visited donors with their visit history
 * GET /api/bloodbank/visited-donors
 */
router.get('/visited-donors', authMiddleware, async (req, res) => {
  try {
    // Verify user is a bloodbank
    // Verify user is a bloodbank or staff
    const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];
    if (req.user.role !== 'bloodbank' && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank or staff role required.'
      });
    }

    // Get the blood bank document to get the correct ID
    let bloodBank;
    if (req.user.role === 'bloodbank') {
      bloodBank = await BloodBank.findOne({ userId: req.user.id });
    } else {
      bloodBank = await BloodBank.findById(req.user.bloodBankId);
    }
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    const bloodBankId = bloodBank._id;

    // Get all bookings that have been completed or arrived at this blood bank
    const bookings = await Booking.find({
      bloodBankId: bloodBankId,
      status: { $in: ['completed', 'confirmed'] }
    })
      .populate('donorId')
      .populate({
        path: 'donorId',
        populate: {
          path: 'userId',
          select: 'name email username phone'
        }
      })
      .sort({ date: -1, time: -1 })
      .lean();

    // Group by donor and collect visit history
    const donorMap = new Map();

    bookings.forEach(booking => {
      if (!booking.donorId) return;

      const donorId = booking.donorId._id.toString();

      if (!donorMap.has(donorId)) {
        donorMap.set(donorId, {
          donor: booking.donorId,
          visits: []
        });
      }

      donorMap.get(donorId).visits.push({
        date: booking.date,
        time: booking.time,
        status: booking.status,
        patientName: booking.patientName,
        patientMRID: booking.patientMRID,
        bloodGroup: booking.bloodGroup,
        completedAt: booking.completedAt,
        arrived: booking.arrived,
        arrivalTime: booking.arrivalTime
      });
    });

    // Convert map to array
    const visitedDonors = Array.from(donorMap.values());

    res.json({
      success: true,
      data: visitedDonors
    });
  } catch (error) {
    console.error('Error fetching visited donors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visited donors',
      error: error.message
    });
  }
});

/**
 * Get bookings for the blood bank
 * GET /api/bloodbank/bookings
 */
router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];
    if (req.user.role !== 'bloodbank' && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank or staff role required.'
      });
    }

    // Get the blood bank document to get the correct ID
    let bloodBank;
    if (req.user.role === 'bloodbank') {
      bloodBank = await BloodBank.findOne({ userId: req.user.id });
    } else {
      bloodBank = await BloodBank.findById(req.user.bloodBankId);
    }
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    const bloodBankId = bloodBank._id;
    const { date, bloodGroup, patientName, patientMRID, status } = req.query;

    // Build query
    const query = { bloodBankId };
    if (date) query.date = date;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (patientName) query.patientName = new RegExp(patientName, 'i');
    if (patientMRID) query.patientMRID = new RegExp(patientMRID, 'i');
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('donorId', 'name bloodGroup contactNumber')
      .populate({
        path: 'donorId',
        populate: {
          path: 'userId',
          select: 'name email username phone'
        }
      })
      .sort({ date: -1, time: -1 })
      .lean();

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

/**
 * Get users for the blood bank
 * GET /api/bloodbank/users
 */
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];
    if (req.user.role !== 'bloodbank' && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank or staff role required.'
      });
    }

    // Get all users (donors and regular users)
    const users = await User.find({
      role: { $in: ['user', 'donor'] }
    })
      .select('-password')
      .lean();

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

/**
 * Get donation requests for the blood bank
 * GET /api/bloodbank/donation-requests
 */
router.get('/donation-requests', authMiddleware, async (req, res) => {
  try {
    const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];
    if (req.user.role !== 'bloodbank' && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank or staff role required.'
      });
    }

    // Get the blood bank document to get the correct ID
    let bloodBank;
    if (req.user.role === 'bloodbank') {
      bloodBank = await BloodBank.findOne({ userId: req.user.id });
    } else {
      bloodBank = await BloodBank.findById(req.user.bloodBankId);
    }
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    const bloodBankId = bloodBank._id;

    const requests = await DonationRequest.find({
      bloodBankId: bloodBankId
    })
      .populate('requesterId', 'name email username')
      .populate('donorId', 'name bloodGroup')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching donation requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation requests',
      error: error.message
    });
  }
});

/**
 * Get analytics and statistics for the blood bank admin dashboard
 * GET /api/bloodbank/analytics
 */
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];
    if (req.user.role !== 'bloodbank' && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank or staff role required.'
      });
    }

    // Get the blood bank document to get the correct ID
    let bloodBank;
    if (req.user.role === 'bloodbank') {
      bloodBank = await BloodBank.findOne({ userId: req.user.id });
    } else {
      bloodBank = await BloodBank.findById(req.user.bloodBankId);
    }
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    const bloodBankId = bloodBank._id;
    const Patient = require('../Models/Patient');

    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    const thisYear = new Date(today);
    thisYear.setFullYear(thisYear.getFullYear() - 1);

    // Bookings statistics
    const totalBookings = await Booking.countDocuments({ bloodBankId });
    const completedBookings = await Booking.countDocuments({
      bloodBankId,
      status: 'completed'
    });
    const pendingBookings = await Booking.countDocuments({
      bloodBankId,
      status: 'pending'
    });
    const confirmedBookings = await Booking.countDocuments({
      bloodBankId,
      status: 'confirmed'
    });
    const todayBookings = await Booking.countDocuments({
      bloodBankId,
      date: { $gte: today }
    });
    const thisWeekBookings = await Booking.countDocuments({
      bloodBankId,
      createdAt: { $gte: thisWeek }
    });
    const thisMonthBookings = await Booking.countDocuments({
      bloodBankId,
      createdAt: { $gte: thisMonth }
    });

    // Patient statistics
    const totalPatients = await Patient.countDocuments({
      bloodBankId,
      isDeleted: false
    });
    const fulfilledPatients = await Patient.countDocuments({
      bloodBankId,
      isFulfilled: true,
      isDeleted: false
    });
    const pendingPatients = await Patient.countDocuments({
      bloodBankId,
      isFulfilled: false,
      isDeleted: false
    });
    const thisMonthPatients = await Patient.countDocuments({
      bloodBankId,
      createdAt: { $gte: thisMonth },
      isDeleted: false
    });

    // Donation requests statistics
    const totalRequests = await DonationRequest.countDocuments({ bloodBankId });
    const pendingRequests = await DonationRequest.countDocuments({
      bloodBankId,
      status: 'pending'
    });
    const acceptedRequests = await DonationRequest.countDocuments({
      bloodBankId,
      status: 'accepted'
    });
    const thisMonthRequests = await DonationRequest.countDocuments({
      bloodBankId,
      createdAt: { $gte: thisMonth }
    });

    // Blood group distribution for bookings
    const bloodGroupStats = await Booking.aggregate([
      { $match: { bloodBankId: bloodBankId, status: 'completed' } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent activity (last 10 bookings)
    const recentBookings = await Booking.find({ bloodBankId })
      .populate('donorId', 'name bloodGroup')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Monthly trend for last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthBookings = await Booking.countDocuments({
        bloodBankId,
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const monthCompleted = await Booking.countDocuments({
        bloodBankId,
        status: 'completed',
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      monthlyTrend.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        bookings: monthBookings,
        completed: monthCompleted
      });
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          completedBookings,
          pendingBookings,
          confirmedBookings,
          totalPatients,
          fulfilledPatients,
          pendingPatients,
          totalRequests,
          pendingRequests,
          acceptedRequests
        },
        timeBased: {
          today: {
            bookings: todayBookings
          },
          thisWeek: {
            bookings: thisWeekBookings
          },
          thisMonth: {
            bookings: thisMonthBookings,
            patients: thisMonthPatients,
            requests: thisMonthRequests
          }
        },
        bloodGroupDistribution: bloodGroupStats,
        monthlyTrend,
        recentActivity: recentBookings
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});


/**
 * Get all staff members for the blood bank
 * GET /api/bloodbank/staff
 */
router.get('/staff', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank role required.'
      });
    }

    const bloodBank = await BloodBank.findOne({ userId: req.user.id });
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    // Find all users with bloodBankId matching this blood bank
    // and exclude standard users/donors/admins (fetch only staff roles)
    const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];

    const staff = await User.find({
      bloodBankId: bloodBank._id,
      role: { $in: staffRoles }
    })
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: staff
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
      error: error.message
    });
  }
});

/**
 * Create a new staff member
 * POST /api/bloodbank/staff
 */
router.post('/staff', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank role required.'
      });
    }

    const { name, role, email, phone } = req.body;

    // Validate role
    const allowedRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff role'
      });
    }

    const bloodBank = await BloodBank.findOne({ userId: req.user.id });
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    // Auto-generate credentials
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    // Use provided email or generate a placeholder if not provided
    // We'll generate a unique username based on the bloodbank name and role

    const cleanBbName = bloodBank.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 10);
    const generatedUsername = `${role}.${cleanBbName}.${randomSuffix}`;
    const generatedEmail = email || `${generatedUsername}@bloodbank.com`;

    // Generate a secure random password (8 chars)
    const generatedPassword = Math.random().toString(36).slice(-8);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: generatedUsername }, { email: generatedEmail }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Conflict generating credentials. Please try again.'
      });
    }

    const newStaff = new User({
      name,
      username: generatedUsername,
      email: generatedEmail,
      password: generatedPassword,
      role,
      bloodBankId: bloodBank._id,
      phone: phone || null,
      provider: 'local',
      emailVerificationCode: null, // Auto-verified
      isBlocked: false,
      isSuspended: false
    });

    await newStaff.save();

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: {
        id: newStaff._id,
        name: newStaff.name,
        role: newStaff.role,
        username: newStaff.username,
        email: newStaff.email,
        generatedPassword: generatedPassword // IMPORTANT: Send back the raw password so admin can see it once
      }
    });

  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating staff',
      error: error.message
    });
  }
});

/**
 * Reset staff password
 * POST /api/bloodbank/staff/:id/reset-password
 */
router.post('/staff/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank role required.'
      });
    }

    const { id } = req.params;
    const bloodBank = await BloodBank.findOne({ userId: req.user.id });

    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    // Find the staff member and ensure they belong to this blood bank
    const staffMember = await User.findOne({
      _id: id,
      bloodBankId: bloodBank._id
    });

    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8);

    // Update password (pre-save hook will hash it)
    staffMember.password = newPassword;
    await staffMember.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        username: staffMember.username,
        newPassword: newPassword
      }
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

module.exports = router;

