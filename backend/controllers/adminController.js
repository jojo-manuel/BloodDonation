const User = require("../Models/User");
const Donor = require("../Models/donor");
const BloodBank = require("../Models/BloodBank");
const Patient = require("../Models/Patient");
const DonationRequest = require("../Models/DonationRequest");
const Activity = require("../Models/Activity");
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