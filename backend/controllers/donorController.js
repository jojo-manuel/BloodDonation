// controllers/donorController.js
// Donor registration/update, search, and retrieval endpoints.

const Donor = require('../Models/donor');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Register a donor profile or update existing one for the authenticated user
 * Body: bloodGroup, availability, lastDonationDate, city, state, pincode, contactPreference
 */
exports.registerOrUpdateDonor = asyncHandler(async (req, res) => {
  try {
    console.log('Register donor request body:', req.body);
    console.log('User ID:', req.user?.id);

    const existing = await Donor.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already registered as donor' });
    }

    const payload = {
      userId: req.user.id,
      name: req.body.name,
      dob: req.body.dob,
      gender: req.body.gender,
      bloodGroup: req.body.bloodGroup,
      contactNumber: req.body.contactNumber,
      emergencyContactNumber: req.body.emergencyContactNumber,
      houseAddress: req.body.houseAddress,
      workAddress: req.body.workAddress,
      weight: req.body.weight,
      availability: req.body.availability,
      lastDonatedDate: req.body.lastDonatedDate || null,
      contactPreference: req.body.contactPreference,
      phone: req.body.phone,
    };

    console.log('Payload to save:', payload);

    const donor = await Donor.create(payload);

    console.log('Saved donor:', donor);

    return res.status(201).json({ success: true, message: 'Donor registered', data: donor });
  } catch (error) {
    console.error('Error in registerOrUpdateDonor:', error);
    throw error;
  }
});

/**
 * Search donors with optional filters and pagination
 * Query: bloodGroup, city, state, pincode, page, limit
 */
exports.searchDonors = asyncHandler(async (req, res) => {
  const { bloodGroup, city, state, pincode, page = 1, limit = 10 } = req.query;
  const maxLimit = Math.min(Number(limit) || 10, 50);
  const skip = (Number(page) - 1) * maxLimit;

  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (city) filter['houseAddress.city'] = city;
  if (state) filter['houseAddress.district'] = state; // Assuming state maps to district
  if (pincode) filter['houseAddress.pincode'] = pincode;

  // Filter lastDonatedDate to be before today
  filter.lastDonatedDate = { $lt: new Date() };

  const [data, total] = await Promise.all([
    Donor.find(filter).populate('userId', 'username').skip(skip).limit(maxLimit).sort({ updatedAt: -1 }),
    Donor.countDocuments(filter),
  ]);

  const pages = Math.ceil(total / maxLimit);
  return res.json({ success: true, message: 'OK', data: { data, page: Number(page), total, pages } });
});

/**
 * Get a single donor by ID
 */
exports.getOne = asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.params.id);
  if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });
  return res.json({ success: true, message: 'OK', data: donor });
});

/**
 * Get the authenticated user's donor profile
 */
exports.getMe = asyncHandler(async (req, res) => {
  const donor = await Donor.findOne({ userId: req.user.id });
  if (!donor) return res.status(404).json({ success: false, message: 'Donor profile not found' });
  return res.json({ success: true, message: 'OK', data: donor });
});

/**
 * Update the authenticated user's donor profile
 */
exports.updateDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findOne({ userId: req.user.id });
  if (!donor) return res.status(404).json({ success: false, message: 'Donor profile not found' });

  const payload = {
    name: req.body.name,
    dob: req.body.dob,
    gender: req.body.gender,
    bloodGroup: req.body.bloodGroup,
    contactNumber: req.body.contactNumber,
    emergencyContactNumber: req.body.emergencyContactNumber,
    houseAddress: req.body.houseAddress,
    workAddress: req.body.workAddress,
    weight: req.body.weight,
    availability: req.body.availability,
    lastDonatedDate: req.body.lastDonatedDate || null,
    contactPreference: req.body.contactPreference,
    phone: req.body.phone,
  };

  const updatedDonor = await Donor.findOneAndUpdate({ userId: req.user.id }, payload, { new: true });
  return res.json({ success: true, message: 'Donor profile updated', data: updatedDonor });
});

/**
 * Delete the authenticated user's donor profile
 */
exports.deleteDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findOne({ userId: req.user.id });
  if (!donor) return res.status(404).json({ success: false, message: 'Donor profile not found' });

  await Donor.findOneAndDelete({ userId: req.user.id });
  return res.json({ success: true, message: 'Donor profile deleted' });
});



