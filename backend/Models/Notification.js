const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: ['slot_reschedule', 'booking_confirmed', 'booking_cancelled', 'request_accepted', 'request_rejected', 'general'],
    required: true
  },
  
  title: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  // Related data
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  donationRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationRequest'
  },
  
  // Reschedule specific data
  rescheduleData: {
    oldDate: Date,
    oldTime: String,
    newDate: Date,
    newTime: String,
    reason: String,
    bloodBankName: String,
    patientName: String,
    bloodGroup: String
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: {
    type: Date
  },
  
  // Email notification
  emailSent: {
    type: Boolean,
    default: false
  },
  
  emailSentAt: {
    type: Date
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
  
}, { timestamps: true });

// Index for faster queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

