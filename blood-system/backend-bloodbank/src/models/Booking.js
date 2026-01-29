const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  donorName: {
    type: String,
    required: true,
    trim: true
  },
  patientName: {
    type: String,
    trim: true
  },
  patientMRID: {
    type: String,
    uppercase: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  email: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  hospital_id: {
    type: String,
    required: true
  },
  tokenNumber: {
    type: String,
    trim: true
  },
  requesterName: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookingSchema.index({ hospital_id: 1, status: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ patientMRID: 1 });
bookingSchema.index({ date: 1 });

module.exports = mongoose.model('Booking', bookingSchema);