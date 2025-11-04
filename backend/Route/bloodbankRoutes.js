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
 * Get blood bank details for the authenticated user
 * GET /api/bloodbank/details
 */
router.get('/details', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bloodBank = await BloodBank.findOne({ userId })
      .populate('userId', 'name email username');
    
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
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank role required.'
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
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank role required.'
      });
    }
    
    // Get the blood bank document to get the correct ID
    const bloodBank = await BloodBank.findOne({ userId: req.user.id });
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
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank role required.'
      });
    }
    
    // Get the blood bank document to get the correct ID
    const bloodBank = await BloodBank.findOne({ userId: req.user.id });
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
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank role required.'
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
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Blood bank role required.'
      });
    }
    
    const bloodBankId = req.user.id;
    
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

module.exports = router;

