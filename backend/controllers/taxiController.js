const Razorpay = require('razorpay');
const crypto = require('crypto');
const TaxiBooking = require('../Models/TaxiBooking');
const DonationRequest = require('../Models/DonationRequest');
const Donor = require('../Models/donor');
const BloodBank = require('../Models/BloodBank');
const asyncHandler = require('../Middleware/asyncHandler');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RP6aD2gNdAuoRE',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'RyTIKYQ5yobfYgNaDrvErQKN'
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
  
  // Fetch donation request with populated data including booking
  const donationRequest = await DonationRequest.findById(donationRequestId)
    .populate({
      path: 'donorId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate('bloodBankId', 'name address')
    .populate('bookingId', 'date time'); // Populate the actual booked slot
  
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
  
  // Calculate suggested pickup time based on booked slot
  let suggestedPickupTime = null;
  let donationDate = null;
  let donationTime = null;
  
  // Priority 1: Use actual booking slot if available
  let appointmentDate = null;
  let appointmentTime = null;
  
  if (donationRequest.bookingId) {
    // Use the actual booked slot
    appointmentDate = donationRequest.bookingId.date;
    appointmentTime = donationRequest.bookingId.time;
  } else if (donationRequest.requestedDate && donationRequest.requestedTime) {
    // Fallback to requested date/time if no booking yet
    appointmentDate = donationRequest.requestedDate;
    appointmentTime = donationRequest.requestedTime;
  }
  
  if (appointmentDate && appointmentTime) {
    donationDate = new Date(appointmentDate).toISOString().split('T')[0];
    donationTime = appointmentTime;
    
    // Parse donation time - handle both "14:30" and "2:30 PM" formats
    let hours, minutes;
    
    // Check if time contains AM/PM
    if (appointmentTime.includes('AM') || appointmentTime.includes('PM')) {
      // Parse "10:00 AM" or "2:30 PM" format
      const timeRegex = /(\d+):(\d+)\s*(AM|PM)/i;
      const match = appointmentTime.match(timeRegex);
      
      if (match) {
        hours = parseInt(match[1]);
        minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
      } else {
        // Fallback
        hours = 0;
        minutes = 0;
      }
    } else {
      // Parse "14:30" format (24-hour)
      [hours, minutes] = appointmentTime.split(':').map(Number);
    }
    
    // Calculate pickup time: donation time - travel time - 15 min buffer
    const BUFFER_MINUTES = 15;
    const totalMinutesToSubtract = estimatedTravelMinutes + BUFFER_MINUTES;
    
    const donationDateTime = new Date(appointmentDate);
    donationDateTime.setHours(hours, minutes, 0, 0);
    
    const pickupDateTime = new Date(donationDateTime.getTime() - (totalMinutesToSubtract * 60 * 1000));
    
    // Format suggested pickup time as HH:MM (24-hour format)
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

// =============================================
// TAXI PARTNER API ENDPOINTS
// For third-party taxi service providers
// =============================================

/**
 * Get all pending/confirmed bookings for taxi partners
 * GET /api/taxi/partner/available-bookings
 * Requires: API Key authentication (partner-specific)
 */
exports.getAvailableBookings = asyncHandler(async (req, res) => {
  const bookings = await TaxiBooking.find({
    status: { $in: ['pending', 'confirmed'] },
    paymentStatus: 'paid'
  })
    .populate('donorId', 'name contactNumber')
    .populate('bloodBankId', 'name address contactNumber')
    .populate('donationRequestId', 'bloodGroup requestedDate requestedTime')
    .sort({ bookingDate: 1, bookingTime: 1 });
  
  // Format response for taxi partners
  const formattedBookings = bookings.map(booking => ({
    bookingId: booking._id,
    pickupAddress: booking.pickupAddress,
    pickupLocation: {
      latitude: booking.pickupLocation?.latitude,
      longitude: booking.pickupLocation?.longitude
    },
    dropAddress: booking.dropAddress,
    dropLocation: {
      latitude: booking.dropLocation?.latitude,
      longitude: booking.dropLocation?.longitude
    },
    passengerName: booking.donorName,
    passengerPhone: booking.donorPhone,
    scheduledDate: booking.bookingDate,
    scheduledTime: booking.bookingTime,
    distanceKm: booking.distanceKm,
    fare: booking.totalFare,
    status: booking.status,
    specialInstructions: booking.notes,
    bloodBankName: booking.bloodBankId?.name,
    bloodBankPhone: booking.bloodBankId?.contactNumber,
    donationType: 'Blood Donation',
    priority: 'high'
  }));
  
  res.json({
    success: true,
    message: 'Available bookings retrieved successfully',
    data: formattedBookings,
    count: formattedBookings.length
  });
});

/**
 * Assign driver to booking
 * PUT /api/taxi/partner/assign-driver/:bookingId
 * Body: { driverName, driverPhone, vehicleNumber, vehicleType }
 */
exports.assignDriver = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { driverName, driverPhone, vehicleNumber, vehicleType } = req.body;
  
  if (!driverName || !driverPhone || !vehicleNumber) {
    return res.status(400).json({
      success: false,
      message: 'Driver name, phone, and vehicle number are required'
    });
  }
  
  const booking = await TaxiBooking.findById(bookingId);
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }
  
  if (booking.status === 'cancelled' || booking.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot assign driver to this booking'
    });
  }
  
  booking.taxiDetails = {
    driverName,
    driverPhone,
    vehicleNumber,
    vehicleType: vehicleType || 'Sedan'
  };
  booking.status = 'assigned';
  await booking.save();
  
  res.json({
    success: true,
    message: 'Driver assigned successfully',
    data: {
      bookingId: booking._id,
      status: booking.status,
      taxiDetails: booking.taxiDetails
    }
  });
});

/**
 * Update booking status
 * PUT /api/taxi/partner/update-status/:bookingId
 * Body: { status, notes }
 * Valid statuses: 'assigned', 'in_transit', 'completed', 'cancelled'
 */
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status, notes } = req.body;
  
  const validStatuses = ['assigned', 'in_transit', 'completed', 'cancelled'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required',
      validStatuses
    });
  }
  
  const booking = await TaxiBooking.findById(bookingId);
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }
  
  booking.status = status;
  if (notes) {
    booking.notes = booking.notes ? `${booking.notes}\n${notes}` : notes;
  }
  
  await booking.save();
  
  res.json({
    success: true,
    message: 'Booking status updated successfully',
    data: {
      bookingId: booking._id,
      status: booking.status,
      updatedAt: new Date()
    }
  });
});

/**
 * Get specific booking details
 * GET /api/taxi/partner/booking/:bookingId
 */
exports.getBookingDetails = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  
  const booking = await TaxiBooking.findById(bookingId)
    .populate('donorId', 'name contactNumber')
    .populate('bloodBankId', 'name address contactNumber')
    .populate('donationRequestId', 'bloodGroup requestedDate requestedTime');
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }
  
  const formattedBooking = {
    bookingId: booking._id,
    pickupAddress: booking.pickupAddress,
    pickupLocation: booking.pickupLocation,
    dropAddress: booking.dropAddress,
    dropLocation: booking.dropLocation,
    passengerName: booking.donorName,
    passengerPhone: booking.donorPhone,
    scheduledDate: booking.bookingDate,
    scheduledTime: booking.bookingTime,
    distanceKm: booking.distanceKm,
    fare: booking.totalFare,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    specialInstructions: booking.notes,
    taxiDetails: booking.taxiDetails,
    bloodBankName: booking.bloodBankId?.name,
    bloodBankPhone: booking.bloodBankId?.contactNumber,
    donationType: 'Blood Donation',
    createdAt: booking.createdAt
  };
  
  res.json({
    success: true,
    data: formattedBooking
  });
});

/**
 * Get bookings assigned to a specific driver
 * GET /api/taxi/partner/driver-bookings
 * Query params: driverPhone
 */
exports.getDriverBookings = asyncHandler(async (req, res) => {
  const { driverPhone } = req.query;
  
  if (!driverPhone) {
    return res.status(400).json({
      success: false,
      message: 'Driver phone number is required'
    });
  }
  
  const bookings = await TaxiBooking.find({
    'taxiDetails.driverPhone': driverPhone,
    status: { $in: ['assigned', 'in_transit'] }
  })
    .populate('donorId', 'name contactNumber')
    .populate('bloodBankId', 'name address')
    .sort({ bookingDate: 1, bookingTime: 1 });
  
  const formattedBookings = bookings.map(booking => ({
    bookingId: booking._id,
    pickupAddress: booking.pickupAddress,
    pickupLocation: booking.pickupLocation,
    dropAddress: booking.dropAddress,
    dropLocation: booking.dropLocation,
    passengerName: booking.donorName,
    passengerPhone: booking.donorPhone,
    scheduledDate: booking.bookingDate,
    scheduledTime: booking.bookingTime,
    distanceKm: booking.distanceKm,
    fare: booking.totalFare,
    status: booking.status,
    specialInstructions: booking.notes
  }));
  
  res.json({
    success: true,
    data: formattedBookings,
    count: formattedBookings.length
  });
});

module.exports = exports;

