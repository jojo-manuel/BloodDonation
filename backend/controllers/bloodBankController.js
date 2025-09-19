
const BloodBank = require("../Models/BloodBank");
const User = require("../Models/User");
const Donor = require("../Models/donor");
const Patient = require("../Models/Patient");
const DonationRequest = require("../Models/DonationRequest");
const asyncHandler = require("../Middleware/asyncHandler");

/**
 * Register a new blood bank user and optionally create blood bank details
 * Body (supports both old and new flows):
 * - Old: { username, password }
 * - New: { username, password, name, address, contactNumber, district, licenseNumber }
 */
exports.registerBloodBankUser = asyncHandler(async (req, res) => {
  const { username, password, name, address, contactNumber, district, licenseNumber } = req.body;

  // Check if username exists in User collection
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Username already exists" });
  }

  // Create User with role 'bloodbank'
  const user = new User({
    username,
    name: username, // Use username as name to satisfy User schema requirement
    password,
    role: "bloodbank",
    provider: "local",
  });
  await user.save();

  // If full blood bank details are provided, create the BloodBank record now
  let bloodBank = null;
  const hasFullDetails = name && address && contactNumber && district && licenseNumber;
  if (hasFullDetails) {
    try {
      bloodBank = await BloodBank.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          name,
          address,
          district,
          contactNumber,
          licenseNumber,
          status: "pending",
        },
        { upsert: true, new: true, runValidators: true }
      );
    } catch (err) {
      // If blood bank creation fails (e.g., duplicate licenseNumber), roll back user and report error
      await User.findByIdAndDelete(user._id).catch(() => {});
      return res.status(400).json({ success: false, message: err.message || "Failed to create blood bank details" });
    }
  }

  return res.status(201).json({
    success: true,
    message: hasFullDetails
      ? "Blood bank user and details registered"
      : "Blood bank user registered",
    data: {
      userId: user._id,
      username: user.username,
      bloodBank,
    },
  });
});

/**
 * Submit blood bank details for approval
 * Body: { name, address, contactNumber, district, licenseNumber }
 */
exports.submitBloodBankDetails = asyncHandler(async (req, res) => {
  const { name, address, contactNumber, district, licenseNumber } = req.body;

  console.log("[DEBUG] submitBloodBankDetails called with:", { userId: req.user._id, name, address, contactNumber, district, licenseNumber });

  // Validate required fields (model also enforces this)
  if (!name || !address || !contactNumber || !district || !licenseNumber) {
    console.log("[DEBUG] Validation failed - missing required fields");
    return res.status(400).json({ success: false, message: "name, address, contactNumber, district, and licenseNumber are required" });
  }

  try {
    // Use upsert to create or update blood bank details
    const savedBloodBank = await BloodBank.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        name,
        address,
        district,
        contactNumber,
        licenseNumber,
        status: "pending",
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log("[DEBUG] Blood bank saved successfully:", savedBloodBank);

    return res.status(200).json({ success: true, message: "Blood bank details submitted for approval", data: savedBloodBank });
  } catch (error) {
    console.error("[DEBUG] Error saving blood bank:", error);
    return res.status(500).json({ success: false, message: "Error saving blood bank details", error: error.message });
  }
});

/**
 * Get blood bank details for the authenticated user
 */
exports.getBloodBankByUser = asyncHandler(async (req, res) => {
  // Ensure the user is a bloodbank
  if (req.user.role !== 'bloodbank') {
    return res.status(403).json({ success: false, message: "Access denied. Bloodbank role required." });
  }

  const bloodBank = await BloodBank.findOne({ userId: req.user._id });
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: "Blood bank details not found. Please submit your details for approval." });
  }
  return res.json({ success: true, data: bloodBank });
});

/**
 * Get all users (excluding admins)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
  res.json({ success: true, data: users });
});

/**
 * Get all donors
 */
exports.getAllDonors = asyncHandler(async (req, res) => {
  const donors = await Donor.find().populate('userId', 'name email username');
  res.json({ success: true, data: donors });
});

/**
 * Set status for a user
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
 * Get donation requests for patients uploaded by the bloodbank
 */
exports.getDonationRequests = asyncHandler(async (req, res) => {
  // Find the bloodbank for the current user
  const bloodBank = await BloodBank.findOne({ userId: req.user._id });
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: 'Blood bank not found' });
  }

  // Find patients uploaded by this bloodbank
  const patients = await Patient.find({ bloodBankId: bloodBank._id }).select('_id');

  // Get donation requests for these patients
  const requests = await DonationRequest.find({ patientId: { $in: patients.map(p => p._id) } })
    .populate('donorId', 'userId bloodGroup phone address')
    .populate('donorId.userId', 'username name email')
    .populate('patientId', 'name bloodGroup address')
    .populate('requesterId', 'username name')
    .sort({ createdAt: -1 });

  // Transform the data to match frontend expectations
  const transformedRequests = requests.map(request => ({
    _id: request._id,
    donorName: request.donorId?.userId?.name || request.donorId?.userId?.username || 'Unknown',
    name: request.donorId?.userId?.name || request.donorId?.userId?.username || 'Unknown',
    email: request.donorId?.userId?.email || 'N/A',
    phone: request.donorId?.phone || 'N/A',
    bloodGroup: request.donorId?.bloodGroup || 'N/A',
    address: request.donorId?.address || 'N/A',
    donationDate: request.requestedDate ? new Date(request.requestedDate).toISOString().split('T')[0] : 'N/A',
    timeSlot: request.requestedTime || 'N/A',
    bloodBankName: bloodBank.name || 'N/A',
    status: request.status || 'pending',
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  }));

  res.json({ success: true, data: transformedRequests });
});
