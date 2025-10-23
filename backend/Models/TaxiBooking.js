const mongoose = require('mongoose');

const TaxiBookingSchema = new mongoose.Schema({
  // User who booked the taxi
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Donor for whom taxi is booked
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  
  // Donation request this taxi is for
  donationRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationRequest',
    required: true
  },
  
  // Blood bank destination
  bloodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true
  },
  
  // Addresses
  pickupAddress: {
    type: String,
    required: true
  },
  
  dropAddress: {
    type: String,
    required: true
  },
  
  // Location coordinates
  pickupLocation: {
    latitude: Number,
    longitude: Number
  },
  
  dropLocation: {
    latitude: Number,
    longitude: Number
  },
  
  // Distance and pricing
  distanceKm: {
    type: Number,
    required: true
  },
  
  baseFare: {
    type: Number,
    default: 50 // Base fare in INR
  },
  
  perKmRate: {
    type: Number,
    default: 15 // Per km rate in INR
  },
  
  totalFare: {
    type: Number,
    required: true
  },
  
  // Booking details
  bookingDate: {
    type: Date,
    required: true
  },
  
  bookingTime: {
    type: String,
    required: true
  },
  
  donorName: String,
  donorPhone: String,
  
  // Payment details
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  amountPaid: Number,
  paidAt: Date,
  
  // Taxi status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'in_transit', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  taxiDetails: {
    driverName: String,
    driverPhone: String,
    vehicleNumber: String,
    vehicleType: String
  },
  
  // Notes
  notes: String,
  cancellationReason: String
  
}, { timestamps: true });

// Index for faster queries
TaxiBookingSchema.index({ userId: 1, createdAt: -1 });
TaxiBookingSchema.index({ donorId: 1 });
TaxiBookingSchema.index({ donationRequestId: 1 });
TaxiBookingSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('TaxiBooking', TaxiBookingSchema);

