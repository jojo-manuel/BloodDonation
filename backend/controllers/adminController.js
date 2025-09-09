const User = require("../Models/User");
const Donor = require("../Models/donor");
const BloodBank = require("../Models/BloodBank");
const asyncHandler = require("../Middleware/asyncHandler");

/**
 * Get all donors
 */
exports.getAllDonors = asyncHandler(async (req, res) => {
  const donors = await Donor.find().populate('userId', 'name email username');
  res.json({ success: true, data: donors });
});

/**
 * Get all users
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ success: true, data: users });
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
