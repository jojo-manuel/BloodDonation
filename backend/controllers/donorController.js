// controllers/donorController.js
// Donor registration/update, search, and retrieval endpoints.

const Donor = require('../Models/donor');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Register a donor profile or update existing one for the authenticated user
 * Body: bloodGroup, availability, lastDonationDate, city, state, pincode, contactPreference
 */
exports.registerOrUpdateDonor = asyncHandler(async (req, res) => {
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
    availability: req.body.availability,
    lastDonatedDate: req.body.lastDonatedDate,
    contactPreference: req.body.contactPreference,
    phone: req.body.phone,
  };

  const existing = await Donor.findOne({ userId: req.user.id });
  const donor = existing
    ? await Donor.findOneAndUpdate({ userId: req.user.id }, payload, { new: true })
    : await Donor.create(payload);

  return res.status(existing ? 200 : 201).json({ success: true, message: existing ? 'Donor updated' : 'Donor registered', data: donor });
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



