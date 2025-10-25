// controllers/donorController.js
// Donor registration/update, search, and retrieval endpoints.

const Donor = require('../Models/donor');
const Patient = require('../Models/Patient');
const DonationRequest = require('../Models/DonationRequest');
const asyncHandler = require('../Middleware/asyncHandler');
const axios = require('axios');

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

    // Auto-fill address details from pincode if not provided
    let houseAddress = validation.data.houseAddress;
    if (houseAddress.pincode && (!houseAddress.houseAddress || !houseAddress.localBody || !houseAddress.city || !houseAddress.district)) {
      try {
        const response = await axios.get(`https://api.postalpincode.in/pincode/${houseAddress.pincode}`);

        if (response.data && response.data[0] && response.data[0].Status === 'Success') {
          const postOffices = response.data[0].PostOffice;
          if (postOffices && postOffices.length > 0) {
            const postOffice = postOffices[0];
            houseAddress = {
              houseName: houseAddress.houseName, // Keep user-provided house name
              houseAddress: houseAddress.houseAddress || '', // Keep if provided, else empty
              localBody: houseAddress.localBody || postOffice.Name || '',
              city: houseAddress.city || postOffice.Block || postOffice.Division || '',
              district: houseAddress.district || postOffice.District || '',
              pincode: houseAddress.pincode
            };
          }
        }
      } catch (error) {
        console.error('Error fetching address from pincode:', error);
        // Continue with user-provided data if API fails
      }
    }

    const payload = {
      userId: req.user.id,
      name: validation.data.name,
      dob: validation.data.dob,
      gender: validation.data.gender,
      bloodGroup: validation.data.bloodGroup,
      contactNumber: validation.data.contactNumber,
      emergencyContactNumber: validation.data.emergencyContactNumber,
      houseAddress: houseAddress,
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
 * Now includes KNN-inspired smart matching algorithm
 * Query: bloodGroup, city, state, pincode, latitude, longitude, smartMatch, page, limit
 */
exports.searchDonors = asyncHandler(async (req, res) => {
  const { 
    bloodGroup, 
    city, 
    state, 
    pincode, 
    availability, 
    latitude, 
    longitude,
    smartMatch = 'true', // Enable smart matching by default
    page = 1, 
    limit = 10 
  } = req.query;
  
  const maxLimit = Math.min(Number(limit) || 10, 50);
  const skip = (Number(page) - 1) * maxLimit;

  const filter = {};
  
  // Basic filters (less strict when smart matching is enabled)
  if (smartMatch !== 'true') {
    // Traditional exact matching
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter['houseAddress.city'] = city;
    if (state) filter['houseAddress.district'] = state;
    if (pincode) filter['houseAddress.pincode'] = pincode;
  }
  
  if (availability === 'available') filter.availability = true;

  // Filter for donors eligible to donate (never donated OR donated 3+ months ago)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
  
  filter.$or = [
    { lastDonatedDate: null }, // Never donated
    { lastDonatedDate: { $exists: false } }, // Field doesn't exist
    { lastDonatedDate: { $lt: threeMonthsAgo } } // Donated more than 3 months ago
  ];

  // Exclude suspended donors from search results
  const User = require('../Models/User');
  const suspendedUserIds = await User.find({ isSuspended: true }).distinct('_id');
  filter.userId = { $nin: suspendedUserIds };

  // Exclude donors who have active bookings (not yet donated)
  const Booking = require('../Models/Booking');
  const activeDonorIds = await Booking.find({ 
    status: { $in: ['pending', 'confirmed'] } 
  }).distinct('donorId');
  
  // Add to the filter to exclude donors with active bookings
  if (filter._id) {
    if (filter._id.$nin) {
      filter._id.$nin = [...filter._id.$nin, ...activeDonorIds];
    } else {
      filter._id = { ...filter._id, $nin: activeDonorIds };
    }
  } else {
    if (activeDonorIds.length > 0) {
      filter._id = { $nin: activeDonorIds };
    }
  }

  // Fetch all eligible donors
  let donors = await Donor.find(filter)
    .populate('userId', 'username name email phone profileImage')
    .lean();

  // Get booking statistics for each donor
  const donorIds = donors.map(d => d._id);
  const bookingStats = await Booking.aggregate([
    { $match: { donorId: { $in: donorIds } } },
    {
      $group: {
        _id: '$donorId',
        completedDonations: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        rejectedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        }
      }
    }
  ]);

  // Add statistics to donors
  const statsMap = new Map(bookingStats.map(s => [s._id.toString(), s]));
  donors = donors.map(donor => ({
    ...donor,
    completedDonations: statsMap.get(donor._id.toString())?.completedDonations || 0,
    rejectedBookings: statsMap.get(donor._id.toString())?.rejectedBookings || 0
  }));

  // Apply smart matching if enabled
  if (smartMatch === 'true' && bloodGroup) {
    const { matchDonors } = require('../utils/donorMatcher');
    
    const searchCriteria = {
      bloodGroup,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      city,
      pincode
    };
    
    // Get matched and scored donors
    donors = matchDonors(donors, searchCriteria);
    
    // Donors are already sorted by score
    const total = donors.length;
    const paginatedDonors = donors.slice(skip, skip + maxLimit);
    const pages = Math.ceil(total / maxLimit);
    
    return res.json({ 
      success: true, 
      message: 'Smart matching applied', 
      smartMatch: true,
      data: { 
        data: paginatedDonors, 
        page: Number(page), 
        total, 
        pages 
      } 
    });
  }

  // Traditional pagination (if smart match disabled)
  const total = donors.length;
  const paginatedDonors = donors.slice(skip, skip + maxLimit);
  const pages = Math.ceil(total / maxLimit);
  
  return res.json({ 
    success: true, 
    message: 'OK', 
    smartMatch: false,
    data: { 
      data: paginatedDonors, 
      page: Number(page), 
      total, 
      pages 
    } 
  });
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

  // Find patient by MRID: normalize to uppercase and compare directly
  const patient = await Patient.findOne({ mrid: mrid.toUpperCase() });
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found with given MR number' });
  }

  // Use patient's bloodGroup to find ALL donors with matching blood group
  const filter = {
    bloodGroup: patient.bloodGroup
  };

  // Exclude suspended and blocked donors from search results
  const User = require('../Models/User');
  const suspendedUserIds = await User.find({ 
    $or: [{ isSuspended: true }, { isBlocked: true }] 
  }).distinct('_id');
  if (suspendedUserIds.length > 0) {
    filter.userId = { $nin: suspendedUserIds };
  }

  // Exclude donors who are blocked at donor level
  filter.isBlocked = { $ne: true };

  // Find all donors with matching blood group, sorted by eligibility
  const donors = await Donor.find(filter)
    .populate('userId', 'username name email phone profileImage')
    .lean()
    .sort({ lastDonatedDate: 1 }); // Sort by oldest donation first (most eligible first)

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
  // Check if user has donor role
  if (req.user.role !== 'donor') {
    return res.status(404).json({
      success: false,
      message: 'User is not registered as a donor.',
      requiresRegistration: true
    });
  }

  const donor = await Donor.findOne({ userId: req.user.id });
  if (!donor) {
    return res.status(404).json({
      success: false,
      message: 'Donor profile not found. Please register as a donor first.',
      requiresRegistration: true
    });
  }

  return res.json({ success: true, message: 'OK', data: donor });
});

/**
 * Update the authenticated user's donor profile
 */
exports.updateDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findOne({ userId: req.user.id });
  if (!donor) return res.status(404).json({ success: false, message: 'Donor profile not found' });

  // Auto-fill address details from pincode if not provided
  let houseAddress = req.body.houseAddress;
  if (houseAddress && houseAddress.pincode && (!houseAddress.houseAddress || !houseAddress.localBody || !houseAddress.city || !houseAddress.district)) {
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${houseAddress.pincode}`);

      if (response.data && response.data[0] && response.data[0].Status === 'Success') {
        const postOffices = response.data[0].PostOffice;
        if (postOffices && postOffices.length > 0) {
          const postOffice = postOffices[0];
          houseAddress = {
            houseName: houseAddress.houseName || donor.houseAddress.houseName, // Keep existing or new
            houseAddress: houseAddress.houseAddress || '', // Keep if provided, else empty
            localBody: houseAddress.localBody || postOffice.Name || '',
            city: houseAddress.city || postOffice.Block || postOffice.Division || '',
            district: houseAddress.district || postOffice.District || '',
            pincode: houseAddress.pincode
          };
        }
      }
    } catch (error) {
      console.error('Error fetching address from pincode:', error);
      // Continue with user-provided data if API fails
    }
  }

  const payload = {
    name: req.body.name,
    dob: req.body.dob,
    gender: req.body.gender,
    bloodGroup: req.body.bloodGroup,
    contactNumber: req.body.contactNumber,
    emergencyContactNumber: req.body.emergencyContactNumber,
    houseAddress: houseAddress || req.body.houseAddress,
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

  const requests = await DonationRequest.find({ donorId: donor._id })
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

/**
 * Get donation requests sent by a user, filtered by username
 * Query: username
 */
exports.getSentRequests = asyncHandler(async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  // Find the user by username
  const User = require('../Models/User');
  const user = await User.findOne({ username });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Find donation requests where the requesterId matches the user's ID
  const requests = await DonationRequest.find({ requesterId: user._id })
    .populate('receiverId', 'username name phone')
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

  res.json({ success: true, data: requests });
});

/**
 * Get address details by postal code using Geocoding API
 * Params: postalCode
 */
exports.getAddressByPostalCode = asyncHandler(async (req, res) => {
  const { postalCode } = req.params;

  if (!postalCode || postalCode.length !== 6 || !/^\d{6}$/.test(postalCode)) {
    return res.status(400).json({ success: false, message: 'Invalid postal code. Must be 6 digits.' });
  }

  try {
    // Use OpenStreetMap Nominatim API to get address details from postal code
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${postalCode}&country=India`, {
      headers: {
        'User-Agent': 'BloodDonationApp/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const address = response.data[0].address;
      const addressDetails = {
        city: address.city || address.town || address.village || '',
        district: address.county || address.state_district || '',
        state: address.state || '',
        country: address.country || ''
      };

      return res.json({ success: true, message: 'Address details retrieved', data: addressDetails });
    } else {
      return res.status(404).json({ success: false, message: 'No address details found for the given postal code.' });
    }
  } catch (error) {
    console.error('Error fetching address details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch address details' });
  }
});

/**
 * Get unique cities where donors are available
 * Returns sorted list of cities with available donors
 */
exports.getAvailableCities = asyncHandler(async (req, res) => {
  try {
    // Exclude suspended donors
    const User = require('../Models/User');
    const suspendedUserIds = await User.find({ isSuspended: true }).distinct('_id');
    
    // Exclude donors who have completed donations
    const Booking = require('../Models/Booking');
    const completedDonorIds = await Booking.find({ status: 'completed' }).distinct('donorId');
    
    const filter = {
      lastDonatedDate: { $lt: new Date() },
      userId: { $nin: suspendedUserIds }
    };
    
    if (completedDonorIds.length > 0) {
      filter._id = { $nin: completedDonorIds };
    }
    
    // Get unique cities from available donors
    const cities = await Donor.distinct('houseAddress.city', filter);
    
    // Filter out empty/null cities and sort alphabetically
    const validCities = cities
      .filter(city => city && city.trim().length > 0)
      .map(city => city.trim())
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    
    return res.json({ 
      success: true, 
      message: 'Available cities retrieved', 
      data: validCities 
    });
  } catch (error) {
    console.error('Error fetching available cities:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch available cities' 
    });
  }
});
