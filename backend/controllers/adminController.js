const User = require("../Models/User");
const Donor = require("../Models/donor");
const BloodBank = require("../Models/BloodBank");
const Patient = require("../Models/Patient");
const DonationRequest = require("../Models/DonationRequest");
const Activity = require("../Models/Activity");
const BloodBankSectionUser = require("../Models/BloodBankSectionUser");
const { sendEmail } = require("../utils/email");
const asyncHandler = require("../Middleware/asyncHandler");

/**
 * Get all donors
 */
exports.getAllDonors = asyncHandler(async (req, res) => {
  const donors = await Donor.find().populate('userId', 'name email username');
  res.json({ success: true, data: donors });
});

/**
 * Get all patients
 */
exports.getAllPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find().populate('bloodBankId', 'name address');
  res.json({ success: true, data: patients });
});

/**
 * Get all users
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
  res.json({ success: true, data: users });
});

/**
 * Get all admins
 */
exports.getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' }).select('-password');
  res.json({ success: true, data: admins });
});

/**
 * Get all bloodbanks
 */
exports.getAllBloodBanks = asyncHandler(async (req, res) => {
  const bloodbanks = await BloodBank.find().populate('userId', 'name email username');
  res.json({ success: true, data: bloodbanks });
});

/**
 * Approve a bloodbank
 */
exports.approveBloodBank = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bloodbank = await BloodBank.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
  if (!bloodbank) {
    return res.status(404).json({ success: false, message: 'Bloodbank not found' });
  }
  res.json({ success: true, message: 'Bloodbank approved', data: bloodbank });
});

/**
 * Reject a bloodbank
 */
exports.rejectBloodBank = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bloodbank = await BloodBank.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
  if (!bloodbank) {
    return res.status(404).json({ success: false, message: 'Bloodbank not found' });
  }
  res.json({ success: true, message: 'Bloodbank rejected', data: bloodbank });
});

/**
 * Register a new admin
 */
exports.registerAdmin = asyncHandler(async (req, res) => {
  const { username, name, email, password } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username, name, and password are required',
      details: {
        missingFields: {
          username: !username,
          name: !name,
          password: !password
        }
      }
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists',
        details: {
          username: username
        }
      });
    }

    // Create new admin user
    const newAdmin = new User({
      username,
      name,
      email,
      password,
      role: 'admin',
      provider: 'local'
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        id: newAdmin._id,
        username: newAdmin.username,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Set status for a user (role: user or admin)
 */
exports.setUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBlocked, isSuspended, warningMessage } = req.body;

  const user = await User.findByIdAndUpdate(id, { isBlocked, isSuspended, warningMessage }, { new: true });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, message: 'User status updated', data: user });
});

/**
 * Set status for a donor
 */
exports.setDonorStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBlocked, isSuspended, warningMessage } = req.body;

  const donor = await Donor.findByIdAndUpdate(id, { isBlocked, isSuspended, warningMessage }, { new: true });
  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }
  res.json({ success: true, message: 'Donor status updated', data: donor });
});

/**
 * Set status for a bloodbank
 */
exports.setBloodBankStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBlocked, isSuspended, warningMessage } = req.body;

  const bloodbank = await BloodBank.findByIdAndUpdate(id, { isBlocked, isSuspended, warningMessage }, { new: true });
  if (!bloodbank) {
    return res.status(404).json({ success: false, message: 'Bloodbank not found' });
  }
  res.json({ success: true, message: 'Bloodbank status updated', data: bloodbank });
});

/**
 * Request donation from a donor
 */
exports.requestDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const donor = await Donor.findById(id).populate('userId', 'name email username');
  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  if (!donor.userId.email) {
    return res.status(400).json({ success: false, message: 'Donor does not have an email address' });
  }

  // Create donation request
  const request = await DonationRequest.create({
    requesterId: req.user.id,
    donorId: id,
    message: message || "We urgently need your blood donation. Please consider donating.",
  });

  // Send email to donor
  try {
    const subject = "Blood Donation Request";
    const text = `Dear ${donor.userId.name},\n\n${request.message}\n\nPlease log in to your dashboard to respond.\n\nThank you,\nBlood Donation Team`;

    await sendEmail(donor.userId.email, subject, text);
  } catch (emailError) {
    console.error('Email sending failed:', emailError);
    // Don't fail the request if email fails, but log it
  }

  res.json({ success: true, message: 'Donation request sent successfully', data: request });
});

/**
 * Get all donation requests with user and donor names
 */
exports.getAllDonationRequests = asyncHandler(async (req, res) => {
  const requests = await DonationRequest.find({})
    .populate('senderId', 'username name')
    .populate('receiverId', 'username name')
    .populate({ path: 'donorId', select: 'userId', populate: { path: 'userId', select: 'username name' } })
    .sort({ createdAt: -1 })
    .lean();

  const data = requests.map(r => ({
    id: r._id,
    userName: r.senderId?.name || r.senderId?.username || 'N/A',
    donorName: r.donorId?.userId?.name || r.donorId?.userId?.username || r.receiverId?.name || r.receiverId?.username || 'N/A',
    date: r.requestedAt || r.createdAt,
  }));

  res.json({ success: true, data });
});

/**
 * Get all activities with filters
 * Query params: username, action, startDate, endDate
 */
exports.getAllActivities = asyncHandler(async (req, res) => {
  const { username, action, startDate, endDate, page = 1, limit = 50 } = req.query;

  // Build filter object
  const filter = {};

  // Filter by action
  if (action && action !== 'all') {
    filter.action = action;
  }

  // Filter by date range
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) {
      filter.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of day
      filter.timestamp.$lte = endDateTime;
    }
  }

  // If username filter is provided, find user first
  if (username && username.trim() !== '') {
    const user = await User.findOne({ 
      username: { $regex: username, $options: 'i' } 
    });
    
    if (user) {
      filter.userId = user._id;
    } else {
      // No user found, return empty result
      return res.json({ 
        success: true, 
        data: [], 
        total: 0,
        page: parseInt(page),
        totalPages: 0
      });
    }
  }

  // Get total count for pagination
  const total = await Activity.countDocuments(filter);

  // Fetch activities with pagination
  const activities = await Activity.find(filter)
    .populate('userId', 'username name email role')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

  res.json({ 
    success: true, 
    data: activities,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

/**
 * Create a section user for a blood bank
 * POST /api/admin/bloodbanks/:bloodBankId/section-users
 */
exports.createSectionUser = asyncHandler(async (req, res) => {
  const { bloodBankId } = req.params;
  const { section, username, password, name, email, phone } = req.body;

  // Validate required fields
  if (!section || !username || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Section, username, password, and name are required'
    });
  }

  // Validate section
  const validSections = ['centrifuge', 'frontdesk', 'store', 'bleeding'];
  if (!validSections.includes(section)) {
    return res.status(400).json({
      success: false,
      message: `Section must be one of: ${validSections.join(', ')}`
    });
  }

  // Check if blood bank exists
  const bloodBank = await BloodBank.findById(bloodBankId);
  if (!bloodBank) {
    return res.status(404).json({
      success: false,
      message: 'Blood bank not found'
    });
  }

  // Check if username already exists
  const existingUser = await BloodBankSectionUser.findOne({ username });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Username already exists'
    });
  }

  // Create section user
  const sectionUser = await BloodBankSectionUser.create({
    bloodBankId,
    section,
    username,
    password,
    name,
    email,
    phone,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Section user created successfully',
    data: {
      id: sectionUser._id,
      username: sectionUser.username,
      name: sectionUser.name,
      section: sectionUser.section,
      bloodBankId: sectionUser.bloodBankId
    }
  });
});

/**
 * Get all section users for a blood bank
 * GET /api/admin/bloodbanks/:bloodBankId/section-users
 */
exports.getSectionUsers = asyncHandler(async (req, res) => {
  const { bloodBankId } = req.params;
  const { section } = req.query;

  // Check if blood bank exists
  const bloodBank = await BloodBank.findById(bloodBankId);
  if (!bloodBank) {
    return res.status(404).json({
      success: false,
      message: 'Blood bank not found'
    });
  }

  // Build query
  const query = { bloodBankId };
  if (section) {
    query.section = section;
  }

  const sectionUsers = await BloodBankSectionUser.find(query)
    .select('-password')
    .populate('createdBy', 'name username')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: sectionUsers
  });
});

/**
 * Update a section user
 * PUT /api/admin/bloodbanks/:bloodBankId/section-users/:userId
 */
exports.updateSectionUser = asyncHandler(async (req, res) => {
  const { bloodBankId, userId } = req.params;
  const { name, email, phone, password, isActive, isBlocked } = req.body;

  // Check if section user exists and belongs to the blood bank
  const sectionUser = await BloodBankSectionUser.findOne({
    _id: userId,
    bloodBankId
  });

  if (!sectionUser) {
    return res.status(404).json({
      success: false,
      message: 'Section user not found'
    });
  }

  // Update fields
  if (name) sectionUser.name = name;
  if (email) sectionUser.email = email;
  if (phone) sectionUser.phone = phone;
  if (password) sectionUser.password = password;
  if (typeof isActive === 'boolean') sectionUser.isActive = isActive;
  if (typeof isBlocked === 'boolean') sectionUser.isBlocked = isBlocked;

  await sectionUser.save();

  res.json({
    success: true,
    message: 'Section user updated successfully',
    data: {
      id: sectionUser._id,
      username: sectionUser.username,
      name: sectionUser.name,
      section: sectionUser.section
    }
  });
});

/**
 * Delete a section user
 * DELETE /api/admin/bloodbanks/:bloodBankId/section-users/:userId
 */
exports.deleteSectionUser = asyncHandler(async (req, res) => {
  const { bloodBankId, userId } = req.params;

  // Check if section user exists and belongs to the blood bank
  const sectionUser = await BloodBankSectionUser.findOne({
    _id: userId,
    bloodBankId
  });

  if (!sectionUser) {
    return res.status(404).json({
      success: false,
      message: 'Section user not found'
    });
  }

  await BloodBankSectionUser.findByIdAndDelete(userId);

  res.json({
    success: true,
    message: 'Section user deleted successfully'
  });
});