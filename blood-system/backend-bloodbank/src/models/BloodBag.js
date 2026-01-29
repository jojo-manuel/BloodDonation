const mongoose = require('mongoose');

const bloodBagSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  donorName: {
    type: String,
    trim: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collectionDate: {
    type: Date,
    required: true
  },
  volume: {
    type: Number,
    required: true,
    min: 1,
    default: 450 // Standard blood bag volume in ml
  },
  status: {
    type: String,
    required: true,
    enum: ['received', 'processing', 'separated', 'expired', 'quarantine', 'discarded'],
    default: 'received'
  },
  hospital_id: {
    type: String,
    required: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiryDate: {
    type: Date
  },
  // Separation tracking
  separatedAt: {
    type: Date
  },
  separatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  separationMethod: {
    type: String,
    enum: ['centrifugation', 'apheresis', 'filtration']
  },
  componentsCount: {
    type: Number,
    default: 0
  },
  // Quality control
  qualityChecked: {
    type: Boolean,
    default: false
  },
  qualityCheckedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  qualityCheckedAt: {
    type: Date
  },
  qualityNotes: {
    type: String,
    trim: true
  },
  // Storage information
  storageLocation: {
    type: String,
    trim: true
  },
  storageTemperature: {
    type: String,
    default: '2-6°C'
  },
  // Additional information
  notes: {
    type: String,
    trim: true
  },
  // Audit fields
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
bloodBagSchema.index({ serialNumber: 1 });
bloodBagSchema.index({ hospital_id: 1, status: 1 });
bloodBagSchema.index({ hospital_id: 1, bloodGroup: 1 });
bloodBagSchema.index({ receivedAt: -1 });
bloodBagSchema.index({ expiryDate: 1 });

// Calculate expiry date before saving (35 days from collection for whole blood)
bloodBagSchema.pre('save', function(next) {
  if (!this.expiryDate && this.collectionDate) {
    this.expiryDate = new Date(this.collectionDate.getTime() + (35 * 24 * 60 * 60 * 1000));
  }
  next();
});

// Virtual for checking if bag is expired
bloodBagSchema.virtual('isExpired').get(function() {
  return this.expiryDate && new Date() > this.expiryDate;
});

// Virtual for checking if bag is expiring soon (within 7 days)
bloodBagSchema.virtual('isExpiringSoon').get(function() {
  if (!this.expiryDate) return false;
  const sevenDaysFromNow = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
  return this.expiryDate <= sevenDaysFromNow && this.expiryDate > new Date();
});

module.exports = mongoose.model('BloodBag', bloodBagSchema);