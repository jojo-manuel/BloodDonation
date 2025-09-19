// controllers/donorController.js
// Donor registration/update, search, and retrieval endpoints.

const Donor = require('../Models/donor');
const Patient = require('../Models/Patient');
const DonationRequest = require('../Models/DonationRequest');
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

    const { donorRegisterBody } = require('../validators/schemas');
    const validation = donorRegisterBody.safeParse(req.body);
    if (!validation.success) {
      console.error('Validation error:', validation.error.format());
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.error.format() });
    }

    const payload = {
      userId: req.user.id,
      name: validation.data.name,
      dob: validation.data.dob,
      gender: validation.data.gender,
      bloodGroup: validation.data.bloodGroup,
      contactNumber: validation.data.contactNumber,
      emergencyContactNumber: validation.data.emergencyContactNumber,
      houseAddress: validation.data.houseAddress,
      workAddress: validation.data.workAddress,
      weight: validation.data.weight,
      availability: validation.data.availability,
      lastDonatedDate: validation.data.lastDonatedDate || null,
      contactPreference: validation.data.contactPreference,
      phone: validation.data.phone,
    };

    console.log('Payload to save:', payload);

    const donor = await Donor.create(payload);

    console.log('Saved donor:', donor);

    // Update user's role to 'donor'
    const User = require('../Models/User');
    await User.findByIdAndUpdate(req.user.id, { role: 'donor' });

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
 * Search donors by patient MRID
 * Params: mrid
 */
exports.searchDonorsByMrid = asyncHandler(async (req, res) => {
  const { mrid } = req.params;
  if (!mrid) {
    return res.status(400).json({ success: false, message: 'MR number is required' });
  }

  // Find patient by decrypted mrid
  const patient = await Patient.findOne({}).where('encryptedMrid').equals(mrid.toUpperCase());
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found with given MR number' });
  }

  // Use patient's bloodGroup to find donors
  const filter = {
    bloodGroup: patient.bloodGroup,
    lastDonatedDate: { $lt: new Date() }
  };

  const donors = await Donor.find(filter).populate('userId', 'username').sort({ updatedAt: -1 });

  return res.json({ success: true, message: 'Donors found', data: donors });
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

/**
 * Get incoming donation requests for the authenticated donor
 */
exports.getIncomingRequests = asyncHandler(async (req, res) => {
  const donor = await Donor.findOne({ userId: req.user.id });
  if (!donor) return res.status(404).json({ success: false, message: 'Donor profile not found' });

  const allRequests = await DonationRequest.find({})
    .populate('requesterId', 'username name phone')
    .populate('donorId', 'userId bloodGroup houseAddress')
    .populate('donorId.userId', 'username')
    .populate({
      path: 'patientId',
      select: 'name bloodGroup address bloodBankId dateNeeded unitsNeeded',
      populate: {
        path: 'bloodBankId',
        select: 'name address',
      },
    })
    .sort({ createdAt: -1 });

  // Filter requests for this donor using string comparison for robustness
  const requests = allRequests.filter(request => {
    const requestDonorId = request.donorId?._id || request.donorId;
    return requestDonorId?.toString() === donor._id.toString() || requestDonorId === donor._id.toString();
  });

  res.json({ success: true, data: requests });
});

/**
 * Respond to a donation request (accept or reject)
 */
exports.respondToRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body; // 'accepted' or 'rejected'

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be accepted or rejected' });
  }

  const donor = await Donor.findOne({ userId: req.user.id });
  if (!donor) return res.status(404).json({ success: false, message: 'Donor profile not found' });

  const request = await DonationRequest.findOne({
    _id: requestId,
    $or: [
      { donorId: donor._id },
      { donorId: donor._id.toString() }
    ]
  });
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  request.status = status;
  request.respondedAt = new Date();
  await request.save();

  res.json({ success: true, message: `Request ${status}`, data: request });
});

/**
 * Book a slot for an accepted donation request
 */
exports.bookSlot = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { requestedDate, requestedTime } = req.body;

  const donor = await Donor.findOne({ userId: req.user.id });
  if (!donor) return res.status(404).json({ success: false, message: 'Donor profile not found' });

  const request = await DonationRequest.findOne({
    _id: requestId,
    status: 'accepted',
    $or: [
      { donorId: donor._id },
      { donorId: donor._id.toString() }
    ]
  });
  if (!request) return res.status(404).json({ success: false, message: 'Accepted request not found' });

  // Generate a simple token number (can be improved)
  const tokenNumber = `TKN-${Date.now()}`;

  request.status = 'booked';
  request.requestedDate = new Date(requestedDate);
  request.requestedTime = requestedTime;
  request.tokenNumber = tokenNumber;
  await request.save();

  res.json({ success: true, message: 'Slot booked successfully', data: request });
});



