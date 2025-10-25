const User = require('../Models/User');
const Donor = require('../Models/donor');
const Activity = require('../Models/Activity');
const asyncHandler = require('../Middleware/asyncHandler');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Multer storage for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Dev-friendly secrets (use .env in production)
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}
function signRefreshToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

async function ensureUniqueUsername(base) {
  let candidate = base;
  let i = 0;
  // Try base, then base_1, base_2, ... until free
  // Cap attempts to avoid infinite loop
  while (i < 1000) {
    const exists = await User.findOne({ username: candidate }).lean();
    if (!exists) return candidate;
    i += 1;
    candidate = `${base}_${i}`;
  }
  // Fallback with timestamp
  return `${base}_${Date.now()}`;
}

/**
 * Register a new user
 * Body: username, password, role (optional, defaults to 'user'), name, email, phone
 */
exports.register = asyncHandler(async (req, res) => {
  try {
    const { username, password, role = 'user', name, email, phone } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const normalizedRole = String(role).toLowerCase();
    if (!["user", "donor", "bloodbank"].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: "Role must be user, donor, or bloodbank" });
    }

    if (username.length < 3) {
      return res.status(400).json({ success: false, message: "Username too short" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ success: false, message: "Username can only contain letters, numbers, and underscores" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password too short" });
    }

    // Ensure unique username (auto-suffix if taken)
    const uniqueUsername = await ensureUniqueUsername(username);

    // Let the model hash the password in pre-save hook (avoid double hash)
    const newUser = new User({
      username: uniqueUsername,
      password,
      role: normalizedRole,
      name: name || uniqueUsername.split('@')[0], // Use part of email as name if not provided
      email: email || uniqueUsername, // Use username as email if not provided
      phone: phone || null
    });
    await newUser.save();

    // Issue tokens
    const accessToken = signAccessToken(newUser);
    const refreshToken = signRefreshToken(newUser);

    // Respond with user info and tokens
    res.status(201).json({
      success: true,
      message: "User registered",
      data: {
        user: { id: newUser._id, username: newUser.username, role: newUser.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});

/**
 * Get current authenticated user's profile
 * Requires: req.user.id (set by auth middleware)
 */
exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // If user is a donor, fetch and include bloodGroup
  if (user.role === 'donor') {
    const donor = await Donor.findOne({ userId: user._id }).select('bloodGroup');
    if (donor) {
      user.bloodGroup = donor.bloodGroup;
    }
  }

  res.json({ success: true, message: 'OK', data: user });
});

/**
 * Get comprehensive user profile with donation history
 * Includes: user info, donor status, donations, patients helped, next donation date
 */
exports.getComprehensiveProfile = asyncHandler(async (req, res) => {
  const Booking = require('../Models/Booking');
  const Patient = require('../Models/Patient');
  
  // Get user basic info
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Initialize response data
  const profileData = {
    user: user.toObject(),
    isDonor: false,
    donorInfo: null,
    donations: [],
    patientsHelped: [],
    nextDonationDate: null,
    totalDonations: 0
  };

  // Check if user exists in Donor collection (regardless of role)
  const donor = await Donor.findOne({ userId: user._id });
  if (donor) {
    // User is a donor if they have a donor profile
    profileData.isDonor = true;
    profileData.donorInfo = {
      bloodGroup: donor.bloodGroup,
      availability: donor.availability,
      lastDonatedDate: donor.lastDonatedDate,
      donatedDates: donor.donatedDates,
      contactNumber: donor.contactNumber,
      weight: donor.weight,
      address: donor.houseAddress,
      priorityPoints: donor.priorityPoints
    };

    // Get all bookings/donations made by this donor
    const donations = await Booking.find({ 
      donorId: donor._id 
    })
      .populate('bloodBankId', 'name address')
      .sort({ createdAt: -1 })
      .lean();

    profileData.donations = donations.map(booking => ({
      id: booking._id,
      bookingId: booking.bookingId,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bloodBank: booking.bloodBankId,
      bloodBankName: booking.bloodBankName,
      patientName: booking.patientName,
      patientMRID: booking.patientMRID,
      bloodGroup: booking.bloodGroup,
      completedAt: booking.completedAt,
      arrived: booking.arrived,
      arrivalTime: booking.arrivalTime
    }));

    profileData.totalDonations = donations.filter(d => d.status === 'completed').length;

    // Get list of unique patients helped
    const completedBookings = donations.filter(d => d.status === 'completed' && d.patientName);
    const uniquePatients = [...new Set(completedBookings.map(b => b.patientName))];
    profileData.patientsHelped = uniquePatients.map(patientName => {
      const booking = completedBookings.find(b => b.patientName === patientName);
      return {
        patientName,
        patientMRID: booking?.patientMRID,
        donationDate: booking?.completedAt || booking?.date,
        bloodGroup: booking?.bloodGroup
      };
    });

    // Calculate next eligible donation date (3 months after last completed donation)
    const completedDonations = donations.filter(d => d.status === 'completed' && d.completedAt);
    if (completedDonations.length > 0) {
      // Sort by completion date to get the most recent
      const sortedCompletedDonations = completedDonations.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
      );
      const lastCompletedDonation = sortedCompletedDonations[0];
      const lastDonationDate = new Date(lastCompletedDonation.completedAt);
      
      // Add 3 months (90 days) to the last donation date
      const nextEligibleDate = new Date(lastDonationDate);
      nextEligibleDate.setDate(nextEligibleDate.getDate() + 90);
      
      profileData.nextDonationDate = nextEligibleDate;
    }
  }

  res.json({ 
    success: true, 
    message: 'Profile data retrieved successfully', 
    data: profileData 
  });
});

/**
 * Update current authenticated user's profile
 * Body fields supported: name, phone, address
 */
exports.updateMe = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.phone !== undefined) updates.phone = req.body.phone;
  if (req.body.address !== undefined) updates.address = req.body.address;

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  res.json({ success: true, message: 'Profile updated', data: user });
});

/**
 * Update current authenticated user's password
 * Body: currentPassword, newPassword
 */
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long'
    });
  }

  // Get user with password field
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user has a password (not OAuth user)
  if (!user.password) {
    return res.status(400).json({
      success: false,
      message: 'Password update not available for OAuth accounts'
    });
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

/**
 * Fetch address details from pincode using postalpincode.in API
 * Query param: pincode
 */
exports.getAddressFromPincode = asyncHandler(async (req, res) => {
  const { pincode } = req.query;

  if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
    return res.status(400).json({
      success: false,
      message: 'Valid 6-digit pincode is required'
    });
  }

  try {
    const axios = require('axios');
    const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);

    if (!response.data || !response.data[0] || response.data[0].Status !== 'Success') {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found or invalid'
      });
    }

    const postOffices = response.data[0].PostOffice;
    if (!postOffices || postOffices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No post offices found for this pincode'
      });
    }

    // Return the first post office details
    const postOffice = postOffices[0];
    const addressData = {
      district: postOffice.District,
      city: postOffice.Block || postOffice.Division,
      localBody: postOffice.Name,
      state: postOffice.State
    };

    res.json({
      success: true,
      message: 'Address details fetched successfully',
      data: addressData
    });

  } catch (error) {
    console.error('Error fetching address from pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address details',
      error: error.message
    });
  }
});

/**
 * Complete profile for Google users
 * Body: name, phone
 */
exports.completeProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required' });
  }

  const updates = { name, phone, needsProfileCompletion: false };
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  res.json({ success: true, message: 'Profile completed', data: user });
});

/**
 * Update donor availability status
 */
exports.updateDonorAvailability = asyncHandler(async (req, res) => {
  const { id } = req.user; // user id from auth middleware
  const { availability } = req.body;

  if (typeof availability !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: "Invalid value for availability. Must be boolean."
    });
  }

  const donor = await Donor.findOneAndUpdate(
    { userId: id },
    { availability },
    { new: true }
  );

  if (!donor) {
    return res.status(404).json({
      success: false,
      message: "Donor not found for the current user."
    });
  }

  res.json({
    success: true,
    message: "Donor availability updated successfully.",
    data: donor
  });
});

/**
 * Upload profile image
 */
exports.uploadProfileImage = [
  upload.single('profileImage'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded."
      });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imagePath },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: "Profile image uploaded successfully.",
      data: user
    });
  })
];
const DonationRequest = require('../Models/DonationRequest');
const BloodBank = require('../Models/BloodBank');
const Booking = require('../Models/Booking');
const { sendEmail } = require('../utils/email');

/**
 * Request donation from a donor
 */
exports.requestDonation = asyncHandler(async (req, res) => {
  const { donorId, bloodBankId, requestedDate, requestedTime, message, patientId } = req.body;

  // Validate required fields
  if (!donorId || !bloodBankId || !requestedDate || !requestedTime) {
    return res.status(400).json({
      success: false,
      message: 'Donor ID, Blood Bank ID, requested date, and time are required'
    });
  }

  try {
    // Get donor details for email
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Get blood bank details
    const bloodBank = await BloodBank.findById(bloodBankId);
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    // Get requester details
    const requester = await User.findById(req.user.id);
    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'Requester not found'
      });
    }

    // Get patient details if patientId provided
    let patient = null;
    if (patientId) {
      patient = await require('../Models/Patient').findById(patientId);
    }

    // Create the donation request
    const donationRequest = await DonationRequest.create({
      requesterId: req.user.id,
      senderId: req.user.id,
      donorId,
      bloodBankId,
      patientId: patientId || null,
      status: 'pending',
      requestedDate: new Date(requestedDate),
      requestedTime,
      message: message || 'We urgently need your blood donation. Please consider donating.',
      // Store additional details for easy access
      requesterUsername: requester.username,
      donorUsername: donor.name,
      bloodBankUsername: bloodBank.name,
      bloodBankAddress: bloodBank.address,
      bloodBankName: bloodBank.name,
      patientUsername: patient ? patient.name : null,
      userPhone: requester.phone
    });

    // Send email notification to donor
    const emailSubject = 'Blood Donation Request - Urgent';
    const emailBody = `
Dear ${donor.name},

You have received a blood donation request from ${requester.name} (${requester.username}).

Request Details:
- Blood Bank: ${bloodBank.name}
- Address: ${bloodBank.address}
- Requested Date: ${new Date(requestedDate).toLocaleDateString()}
- Requested Time: ${requestedTime}
- Message: ${message || 'We urgently need your blood donation. Please consider donating.'}

Please log in to your dashboard to accept or decline this request.

Thank you for considering to save a life!

Best regards,
Blood Donation Team
    `;

    try {
      await sendEmail(donor.email, emailSubject, emailBody);
      console.log('Donation request email sent successfully to:', donor.email);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    // Log donation request activity
    await Activity.create({
      userId: req.user.id,
      role: req.user.role || 'user',
      action: 'donation_request_sent',
      details: {
        donorId,
        bloodBankId,
        requestedDate,
        requestedTime,
        requestId: donationRequest._id
      }
    });

    res.json({
      success: true,
      message: 'Donation request sent successfully',
      data: donationRequest
    });

  } catch (error) {
    console.error('Error creating donation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send donation request',
      error: error.message
    });
  }
});

// Helper function to generate token number based on time (15-50 range)
function generateTokenNumber(requestedTime, bloodBankId, requestedDate) {
  let hour, minute;
  
  // Try to parse 12-hour format first (e.g., "10:00 AM")
  const time12Match = requestedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  
  if (time12Match) {
    // 12-hour format
    hour = parseInt(time12Match[1]);
    minute = parseInt(time12Match[2]);
    const ampm = time12Match[3].toUpperCase();
    
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  } else {
    // Try 24-hour format (e.g., "14:30")
    const time24Match = requestedTime.match(/(\d+):(\d+)/);
    if (!time24Match) {
      throw new Error('Invalid time format. Expected formats: "10:00 AM" or "14:30"');
    }
    
    hour = parseInt(time24Match[1]);
    minute = parseInt(time24Match[2]);
    
    // Validate 24-hour format
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time values. Hour must be 0-23, minute must be 0-59');
    }
  }

  const totalMinutes = hour * 60 + minute;

  // 9 AM = 540 minutes, 4 PM = 960 minutes
  const minMinutes = 9 * 60; // 540
  const maxMinutes = 16 * 60; // 960
  const minToken = 15;
  const maxToken = 50; // Changed from 70 to 50

  // Linear interpolation
  let baseToken = minToken + ((totalMinutes - minMinutes) / (maxMinutes - minMinutes)) * (maxToken - minToken);
  baseToken = Math.round(baseToken);

  // Ensure within bounds
  if (baseToken < minToken) baseToken = minToken;
  if (baseToken > maxToken) baseToken = maxToken;

  return baseToken;
}

// Helper function to generate custom booking ID (4 alphabets + 4 numbers)
function generateBookingId() {
  const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  let bookingId = '';
  // Generate 4 random alphabets
  for (let i = 0; i < 4; i++) {
    bookingId += alphabets.charAt(Math.floor(Math.random() * alphabets.length));
  }
  // Generate 4 random numbers
  for (let i = 0; i < 4; i++) {
    bookingId += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return bookingId;
}

/**
 * Direct book slot - Creates a booking record and sends notification to blood bank
 */
exports.directBookSlot = asyncHandler(async (req, res) => {
  const {
    donorId,
    bloodBankId,
    requestedDate,
    requestedTime,
    donationRequestId,
    patientName,
    donorName,
    requesterName
  } = req.body;

  // Validate required fields
  if (!donorId || !bloodBankId || !requestedDate || !requestedTime || !donationRequestId) {
    return res.status(400).json({
      success: false,
      message: 'Donor ID, Blood Bank ID, requested date, time, and donation request ID are required'
    });
  }

  try {
    console.log('📅 Processing booking request:', { donorId, bloodBankId, requestedDate, requestedTime });
    
    // Get donor details
    const donor = await Donor.findById(donorId).populate('userId', 'username name email');
    if (!donor) {
      console.error('❌ Donor not found:', donorId);
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }
    console.log('✅ Donor found:', donor.name);

    // Get blood bank details
    const bloodBank = await BloodBank.findById(bloodBankId);
    if (!bloodBank) {
      console.error('❌ Blood bank not found:', bloodBankId);
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }
    console.log('✅ Blood bank found:', bloodBank.name);

    // Get donation request details
    const donationRequest = await DonationRequest.findById(donationRequestId);
    if (!donationRequest) {
      console.error('❌ Donation request not found:', donationRequestId);
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }
    console.log('✅ Donation request found');


    // Check booking constraints
    // 1. Max 3 bookings per slot (same date/time/bloodBank)
    const bookingDate = new Date(requestedDate);
    const slotBookings = await Booking.find({
      bloodBankId,
      date: {
        $gte: new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate()),
        $lt: new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate() + 1)
      },
      time: requestedTime
    });

    if (slotBookings.length >= 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 bookings allowed per time slot.' });
    }

    // 2. Max 35 total bookings per blood bank
    const totalBloodBankBookings = await Booking.countDocuments({ bloodBankId });
    if (totalBloodBankBookings >= 35) {
      return res.status(400).json({ success: false, message: 'Maximum booking capacity reached for this blood bank.' });
    }

    // Generate token number based on time (15-50 range)
    let tokenNumber = generateTokenNumber(requestedTime, bloodBankId, requestedDate);

    // Check for existing tokens on the same day and increment if necessary
    const existingBookings = await Booking.find({
      bloodBankId,
      date: {
        $gte: new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate()),
        $lt: new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate() + 1)
      }
    }).sort({ tokenNumber: -1 });

    const existingTokens = existingBookings.map(b => parseInt(b.tokenNumber)).filter(t => !isNaN(t));
    while (existingTokens.includes(tokenNumber) && tokenNumber < 50) {
      tokenNumber++;
    }

    if (tokenNumber > 50) {
      return res.status(400).json({ success: false, message: 'No slots available for this date. Maximum token number reached.' });
    }

    tokenNumber = tokenNumber.toString();

    // Generate custom booking ID
    let bookingId;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      bookingId = generateBookingId();
      const existingBooking = await Booking.findOne({ bookingId });
      if (!existingBooking) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ success: false, message: 'Failed to generate unique booking ID.' });
    }

    // Get patient details if donationRequest has patientId
    const patient = donationRequest.patientId ? await require('../Models/Patient').findById(donationRequest.patientId) : null;

    // Create booking record
    const booking = await Booking.create({
      bookingId,
      bloodBankId,
      date: new Date(requestedDate),
      time: requestedTime,
      donorId,
      status: 'pending',
      donationRequestId,
      tokenNumber,
      patientName: patientName || patient?.name || 'N/A',
      donorName: donorName || donor.name || donor.userId?.name || 'N/A',
      requesterName: requesterName || 'N/A',
      bloodBankName: donor.bloodBankName || bloodBank.name,
      bloodGroup: donor.bloodGroup,
      patientMRID: patient?.mrid || 'N/A'
    });

    // Update donation request status to indicate booking is in progress
    await DonationRequest.findByIdAndUpdate(donationRequestId, {
      status: 'booked',
      bookingId: booking._id
    });

    // Send email notification to blood bank
    const emailSubject = 'New Donation Booking Request - Action Required';
    const emailBody = `
Dear ${bloodBank.name} Team,

A donor has booked a slot for blood donation through our platform.

Booking Details:
- Booking ID: ${booking._id}
- Donor: ${donor.name} (${donor.userId?.email || 'N/A'})
- Blood Group: ${donor.bloodGroup}
- Patient: ${patientName || 'N/A'}
- Requested Date: ${new Date(requestedDate).toLocaleDateString()}
- Requested Time: ${requestedTime}
- Requester: ${requesterName || 'N/A'}

Please log in to your dashboard to review and confirm this booking.

Thank you for your service in saving lives!

Best regards,
Blood Donation Team
    `;

    try {
      if (bloodBank.email) {
        await sendEmail(bloodBank.email, emailSubject, emailBody);
        console.log('Booking notification email sent successfully to blood bank:', bloodBank.email);
      } else {
        console.warn('⚠️ Blood bank has no email address, skipping notification');
      }
    } catch (emailError) {
      console.error('Failed to send booking email:', emailError);
      // Don't fail the booking if email fails, just log it
    }

    // Log booking activity
    await Activity.create({
      userId: req.user.id,
      role: req.user.role || 'user',
      action: 'booking_created',
      details: {
        donorId,
        bloodBankId,
        requestedDate,
        requestedTime,
        bookingId: booking._id,
        donationRequestId
      }
    });

    // Generate PDF summary
    let pdfUrl = null;
    try {
      const PDFDocument = require('pdfkit');
      const QRCode = require('qrcode');
      const fs = require('fs');
      const path = require('path');

      // Populate booking data
      await booking.populate('donorId', 'userId name bloodGroup contactNumber houseAddress');
      await booking.populate('donorId.userId', 'username name email');
      await booking.populate('bloodBankId', 'name address');

      // Safety checks for populated data
      const donorName = booking.donorName || booking.donorId?.userId?.name || booking.donorId?.name || 'N/A';
      const donorUsername = booking.donorId?.userId?.username || 'N/A';
      const donorBloodGroup = booking.bloodGroup || booking.donorId?.bloodGroup || 'N/A';
      const bloodBankName = booking.bloodBankName || booking.bloodBankId?.name || 'N/A';
      const bloodBankAddress = booking.bloodBankId?.address || 'N/A';

      const doc = new PDFDocument();
      const pdfPath = path.join(__dirname, '../uploads', `booking-${booking._id}.pdf`);
      doc.pipe(fs.createWriteStream(pdfPath));

      // PDF Content
      doc.fontSize(20).text('Blood Donation Booking Confirmation', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`Token Number: ${booking.tokenNumber}`);
      doc.text(`Donor Name: ${donorName}`);
      doc.text(`Donor ID: ${donorUsername}`);
      doc.text(`Blood Group: ${donorBloodGroup}`);
      doc.text(`Blood Bank: ${bloodBankName}`);
      doc.text(`Address: ${bloodBankAddress}`);
      doc.text(`Date: ${new Date(booking.date).toLocaleDateString()}`);
      doc.text(`Time: ${booking.time}`);
      doc.moveDown();

      // Generate QR Code
      const qrData = JSON.stringify({
        token: booking.tokenNumber,
        donor: donorName,
        donorId: donorUsername,
        bloodBank: bloodBankName,
        address: bloodBankAddress,
        date: new Date(booking.date).toLocaleDateString(),
        time: booking.time
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData);
      const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

      // Add QR Code to PDF (simplified - in real implementation you'd need to handle image embedding)
      doc.text('Scan QR Code for details:');
      doc.moveDown();
      doc.text(qrData); // Placeholder - actual QR image would need additional setup

      doc.end();

      pdfUrl = `/uploads/booking-${booking._id}.pdf`;
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Don't fail the booking if PDF fails
    }

    res.json({
      success: true,
      message: 'Booking request sent successfully! The blood bank will review and confirm your appointment.',
      data: { booking, pdfUrl }
    });

  } catch (error) {
    console.error('❌ Error creating booking:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
  
/**
 * Get user's donation requests (only received for donors)
 */
exports.getMyRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Check if user is a donor
  const donor = await Donor.findOne({ userId });

  if (!donor) {
    return res.status(403).json({
      success: false,
      message: 'Only donors can view donation requests'
    });
  }

  // For donors, only show received requests
  const requests = await DonationRequest.find({ donorId: donor._id })
    .populate('requesterId', 'username name phone')
    .populate('donorId', 'userId name bloodGroup houseAddress')
    .populate('donorId.userId', 'username')
    .populate('bloodBankId', 'name address')
    .sort({ createdAt: -1 });

  // Add type field as 'received'
  const requestsWithType = requests.map(request => {
    const requestObj = request.toObject();
    requestObj.type = 'received';
    return requestObj;
  });

  res.json({ success: true, data: requestsWithType });
});

/**
 * Cancel a donation request
 */
exports.cancelRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const request = await DonationRequest.findOne({
    _id: id,
    requesterId: userId,
    status: 'pending'
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found or cannot be cancelled'
    });
  }

  request.status = 'cancelled';
  await request.save();

  // Log cancellation activity
  await Activity.create({
    userId: req.user.id,
    role: req.user.role || 'user',
    action: 'request_cancelled',
    details: { requestId: id }
  });

  res.json({ success: true, message: 'Request cancelled successfully', data: request });
});

/**
 * Suspend the authenticated user's account for 3 months
 */
exports.suspendMe = asyncHandler(async (req, res) => {
  const suspendUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months from now

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      isSuspended: true,
      suspendUntil,
      blockMessage: 'Account suspended by user for 3 months'
    },
    { new: true }
  ).select('-password');

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  res.json({
    success: true,
    message: 'Account suspended successfully. You will be logged out.',
    data: { suspendUntil }
  });
});

/**
 * Unsuspend the authenticated user's account
 */
exports.unsuspendMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      isSuspended: false,
      suspendUntil: null,
      blockMessage: null
    },
    { new: true }
  ).select('-password');

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  res.json({
    success: true,
    message: 'Account unsuspended successfully.',
    data: user
  });
});

/**
 * Soft delete the authenticated user's account
 */
exports.deleteMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, { isDeleted: true }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'Account deleted successfully', data: user });
});

/**
 * Get approved blood banks
 */
exports.getApprovedBloodBanks = asyncHandler(async (req, res) => {
  const bloodBanks = await BloodBank.find({ status: 'approved' }).select('name address');
  res.json({ success: true, data: bloodBanks });
});

console.log('directBookSlot:', typeof exports.directBookSlot);
console.log('getApprovedBloodBanks:', typeof exports.getApprovedBloodBanks);
