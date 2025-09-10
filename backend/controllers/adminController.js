const User = require("../Models/User");
const Donor = require("../Models/donor");
const BloodBank = require("../Models/BloodBank");
const Patient = require("../Models/Patient");
const asyncHandler = require("../middleware/asyncHandler");

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
