const BloodBank = require("../Models/BloodBank");
const User = require("../Models/User");
const asyncHandler = require("../middleware/asyncHandler");

/**
 * Register a new blood bank user (username/password)
 * Body: { username, password }
 */
exports.registerBloodBankUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

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

  return res.status(201).json({ success: true, message: "Blood bank user registered", data: { userId: user._id, username: user.username } });
});

/**
 * Submit blood bank details for approval
 * Body: { userId, name, address, contactNumber, district, licenseNumber }
 */
exports.submitBloodBankDetails = asyncHandler(async (req, res) => {
  const { userId, name, address, contactNumber, district, licenseNumber } = req.body;

  // Validate required fields (model also enforces this)
  if (!userId || !name || !address || !contactNumber || !district || !licenseNumber) {
    return res.status(400).json({ success: false, message: "userId, name, address, contactNumber, district, and licenseNumber are required" });
  }

  // Find existing blood bank by userId
  let bloodBank = await BloodBank.findOne({ userId });
  if (bloodBank) {
    // Update existing blood bank details and reset status to pending
    bloodBank.name = name;
    bloodBank.address = address;
    bloodBank.district = district;
    bloodBank.contactNumber = contactNumber;
    bloodBank.licenseNumber = licenseNumber;
    bloodBank.status = "pending";
  } else {
    // Create new blood bank document
    bloodBank = new BloodBank({
      userId,
      name,
      address,
      district,
      contactNumber,
      licenseNumber,
      status: "pending",
    });
  }
  await bloodBank.save();

  return res.status(200).json({ success: true, message: "Blood bank details submitted for approval", data: bloodBank });
});

/**
 * Get blood bank details by userId
 * Query param: userId
 */
exports.getBloodBankByUser = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const bloodBank = await BloodBank.findOne({ userId });
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: "Blood bank details not found" });
  }
  return res.json({ success: true, data: bloodBank });
});
