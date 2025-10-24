const Razorpay = require('razorpay');
const crypto = require('crypto');
const TaxiBooking = require('../Models/TaxiBooking');
const DonationRequest = require('../Models/DonationRequest');
const Donor = require('../Models/donor');
const BloodBank = require('../Models/BloodBank');
const asyncHandler = require('../Middleware/asyncHandler');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
});

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate taxi fare based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {object} Fare breakdown
 */
function calculateFare(distanceKm) {
  const baseFare = 50; // Base fare in INR
  const perKmRate = 15; // Per km rate in INR
  
  const distanceFare = distanceKm * perKmRate;
  const totalFare = baseFare + distanceFare;
  
  return {
    baseFare,
    perKmRate,
    distanceKm,
    distanceFare: Math.round(distanceFare),
    totalFare: Math.round(totalFare)
  };
}

/**
 * Get donor and blood bank addresses and calculate distance
 * POST /api/taxi/calculate-fare
 * Body: { donationRequestId }
 */
exports.calculateFare = asyncHandler(async (req, res) => {
  const { donationRequestId } = req.body;
  
  if (!donationRequestId) {
    return res.status(400).json({
      success: false,
      message: 'Donation request ID is required'
    });
  }
  
  // Fetch donation request with populated data
  const donationRequest = await DonationRequest.findById(donationRequestId)
    .populate({
      path: 'donorId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate('bloodBankId', 'name address');
  
  if (!donationRequest) {
    return res.status(404).json({
      success: false,
      message: 'Donation request not found'
    });
  }
  
  const donor = donationRequest.donorId;
  const bloodBank = donationRequest.bloodBankId;
  
  if (!donor || !bloodBank) {
    return res.status(400).json({
      success: false,
      message: 'Donor or blood bank information missing'
    });
  }
  
  // Get addresses
  const donorAddress = donor.houseAddress 
    ? `${donor.houseAddress.houseName || ''}, ${donor.houseAddress.houseAddress || ''}, ${donor.houseAddress.city || ''}, ${donor.houseAddress.district || ''}, ${donor.houseAddress.state || ''}, ${donor.houseAddress.pincode || ''}`.trim()
    : 'Address not available';
    
  const bloodBankAddress = bloodBank.address || 'Address not available';
  
  // Calculate distance
  // Note: For more accurate distances, you should use Google Maps Distance Matrix API
  // For now, using a simplified calculation
  
  let distanceKm = 10; // Default fallback
  
  // If we have coordinates, calculate real distance
  if (donor.location?.latitude && donor.location?.longitude &&
      bloodBank.location?.latitude && bloodBank.location?.longitude) {
    distanceKm = calculateDistance(
      donor.location.latitude,
      donor.location.longitude,
      bloodBank.location.latitude,
      bloodBank.location.longitude
    );
  }
  
  // Calculate fare
  const fareDetails = calculateFare(distanceKm);
  
  // Calculate estimated travel time at 50 km/h
  const AVERAGE_SPEED_KMH = 50;
  const estimatedTravelMinutes = Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60);
  
  // Calculate suggested pickup time
  let suggestedPickupTime = null;
  let donationDate = null;
  let donationTime = null;
  
  if (donationRequest.requestedDate && donationRequest.requestedTime) {
    donationDate = new Date(donationRequest.requestedDate).toISOString().split('T')[0];
    donationTime = donationRequest.requestedTime;
    
    // Parse donation time (assuming format like "14:30")
    const [hours, minutes] = donationRequest.requestedTime.split(':').map(Number);
    
    // Calculate pickup time: donation time - travel time - 15 min buffer
    const BUFFER_MINUTES = 15;
    const totalMinutesToSubtract = estimatedTravelMinutes + BUFFER_MINUTES;
    
    const donationDateTime = new Date(donationRequest.requestedDate);
    donationDateTime.setHours(hours, minutes, 0, 0);
    
    const pickupDateTime = new Date(donationDateTime.getTime() - (totalMinutesToSubtract * 60 * 1000));
    
    // Format suggested pickup time as HH:MM
    const pickupHours = String(pickupDateTime.getHours()).padStart(2, '0');
    const pickupMinutes = String(pickupDateTime.getMinutes()).padStart(2, '0');
    suggestedPickupTime = `${pickupHours}:${pickupMinutes}`;
  }
  
  res.json({
    success: true,
    data: {
      donorAddress,
      bloodBankAddress,
      donorName: donor.name || donor.userId?.name,
      donorPhone: donor.contactNumber || donor.userId?.phone,
      bloodBankName: bloodBank.name,
      distance: fareDetails,
      pickupLocation: donor.location,
      dropLocation: bloodBank.location,
      estimatedTravelMinutes,
      donationDate,
      donationTime,
      suggestedPickupTime
    }
  });
});

/**
 * Create Razorpay order for taxi booking
 * POST /api/taxi/create-order
 * Body: { donationRequestId, amount, bookingDate, bookingTime }
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const { donationRequestId, amount, bookingDate, bookingTime } = req.body;
  
  if (!donationRequestId || !amount || !bookingDate || !bookingTime) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Create Razorpay order
  const options = {
    amount: amount * 100, // Amount in paise (smallest currency unit)
    currency: 'INR',
    receipt: `taxi_${Date.now()}`,
    notes: {
      donationRequestId,
      bookingDate,
      bookingTime,
      userId: req.user.id
    }
  };
  
  try {
    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID'
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

/**
 * Verify payment and create taxi booking
 * POST /api/taxi/verify-payment
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingData }
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    bookingData
  } = req.body;
  
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: 'Missing payment verification data'
    });
  }
  
  // Verify signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
    .update(body.toString())
    .digest('hex');
  
  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
  
  // Payment verified, create taxi booking
  try {
    const taxiBooking = await TaxiBooking.create({
      userId: req.user.id,
      donorId: bookingData.donorId,
      donationRequestId: bookingData.donationRequestId,
      bloodBankId: bookingData.bloodBankId,
      pickupAddress: bookingData.pickupAddress,
      dropAddress: bookingData.dropAddress,
      pickupLocation: bookingData.pickupLocation,
      dropLocation: bookingData.dropLocation,
      distanceKm: bookingData.distanceKm,
      baseFare: bookingData.baseFare,
      perKmRate: bookingData.perKmRate,
      totalFare: bookingData.totalFare,
      bookingDate: bookingData.bookingDate,
      bookingTime: bookingData.bookingTime,
      donorName: bookingData.donorName,
      donorPhone: bookingData.donorPhone,
      paymentStatus: 'paid',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amountPaid: bookingData.totalFare,
      paidAt: new Date(),
      status: 'confirmed',
      notes: bookingData.notes
    });
    
    res.json({
      success: true,
      message: 'Taxi booked successfully!',
      data: taxiBooking
    });
  } catch (error) {
    console.error('Taxi booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verified but booking failed',
      error: error.message
    });
  }
});

/**
 * Get user's taxi bookings
 * GET /api/taxi/my-bookings
 */
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await TaxiBooking.find({ userId: req.user.id })
    .populate('donorId', 'name contactNumber')
    .populate('bloodBankId', 'name address')
    .populate('donationRequestId', 'bloodGroup requestedDate requestedTime')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: bookings,
    count: bookings.length
  });
});

/**
 * Cancel taxi booking
 * PUT /api/taxi/:bookingId/cancel
 */
exports.cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { cancellationReason } = req.body;
  
  const booking = await TaxiBooking.findOne({
    _id: bookingId,
    userId: req.user.id
  });
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }
  
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel this booking'
    });
  }
  
  booking.status = 'cancelled';
  booking.cancellationReason = cancellationReason || 'Cancelled by user';
  await booking.save();
  
  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking
  });
});

module.exports = exports;

