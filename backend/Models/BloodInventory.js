const mongoose = require('mongoose');

const BloodInventorySchema = new mongoose.Schema({
  bloodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true,
    index: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    required: true,
    index: true
  },
  donationType: {
    type: String,
    enum: ['whole_blood', 'plasma', 'platelets', 'red_cells'],
    default: 'whole_blood',
    required: true
  },
  firstSerialNumber: {
    type: Number,
    required: true,
    index: true
  },
  lastSerialNumber: {
    type: Number,
    required: true,
    index: true
  },
  unitsCount: {
    type: Number,
    required: true
  },
  collectionDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true,
    index: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor'
  },
  donorName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'used', 'expired'],
    default: 'available',
    index: true
  },
  location: {
    type: String,
    trim: true // Storage location (e.g., "Refrigerator A, Shelf 2")
  },
  temperature: {
    type: String,
    trim: true // Storage temperature (e.g., "2-6°C")
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Additional tracking fields
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reservedAt: {
    type: Date
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usedAt: {
    type: Date
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  // Quality control fields
  qualityCheck: {
    passed: {
      type: Boolean,
      default: true
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: {
      type: Date
    },
    notes: {
      type: String
    }
  }
}, { 
  timestamps: true 
});

// Compound indexes for better query performance
BloodInventorySchema.index({ bloodBankId: 1, bloodGroup: 1 });
BloodInventorySchema.index({ bloodBankId: 1, status: 1 });
BloodInventorySchema.index({ bloodBankId: 1, expiryDate: 1 });
BloodInventorySchema.index({ bloodBankId: 1, status: 1, expiryDate: 1 });
BloodInventorySchema.index({ firstSerialNumber: 1, lastSerialNumber: 1 });

// Pre-save middleware to calculate units count and validate serial numbers
BloodInventorySchema.pre('save', function(next) {
  // Calculate units count
  if (this.firstSerialNumber && this.lastSerialNumber) {
    if (this.firstSerialNumber > this.lastSerialNumber) {
      return next(new Error('First serial number must be less than or equal to last serial number'));
    }
    this.unitsCount = this.lastSerialNumber - this.firstSerialNumber + 1;
  }
  
  // Auto-expire items past expiry date
  if (this.expiryDate && new Date() > this.expiryDate && this.status !== 'used') {
    this.status = 'expired';
  }
  
  // Set reservation/usage timestamps
  if (this.isModified('status')) {
    if (this.status === 'reserved' && !this.reservedAt) {
      this.reservedAt = new Date();
    } else if (this.status === 'used' && !this.usedAt) {
      this.usedAt = new Date();
    }
  }
  
  next();
});

// Instance methods
BloodInventorySchema.methods.getDaysUntilExpiry = function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

BloodInventorySchema.methods.isExpiringSoon = function(days = 14) {
  return this.getDaysUntilExpiry() <= days && this.getDaysUntilExpiry() > 0;
};

BloodInventorySchema.methods.isExpired = function() {
  return this.getDaysUntilExpiry() <= 0;
};

BloodInventorySchema.methods.reserve = function(userId, patientId = null) {
  if (this.status !== 'available') {
    throw new Error('Item is not available for reservation');
  }
  
  this.status = 'reserved';
  this.reservedBy = userId;
  this.reservedAt = new Date();
  if (patientId) {
    this.patientId = patientId;
  }
  
  return this.save();
};

BloodInventorySchema.methods.release = function() {
  if (this.status !== 'reserved') {
    throw new Error('Item is not reserved');
  }
  
  this.status = 'available';
  this.reservedBy = undefined;
  this.reservedAt = undefined;
  this.patientId = undefined;
  
  return this.save();
};

BloodInventorySchema.methods.markAsUsed = function(userId, patientId = null) {
  if (!['available', 'reserved'].includes(this.status)) {
    throw new Error('Item is not available for use');
  }
  
  this.status = 'used';
  this.usedBy = userId;
  this.usedAt = new Date();
  if (patientId) {
    this.patientId = patientId;
  }
  
  return this.save();
};

// Static methods
BloodInventorySchema.statics.findBySerialNumber = function(serialNumber, bloodBankId = null) {
  const query = {
    firstSerialNumber: { $lte: serialNumber },
    lastSerialNumber: { $gte: serialNumber }
  };
  
  if (bloodBankId) {
    query.bloodBankId = bloodBankId;
  }
  
  return this.findOne(query);
};

BloodInventorySchema.statics.getAvailableUnits = function(bloodBankId, bloodGroup = null) {
  const match = {
    bloodBankId,
    status: 'available'
  };
  
  if (bloodGroup) {
    match.bloodGroup = bloodGroup;
  }
  
  return this.aggregate([
    { $match: match },
    { $group: { _id: '$bloodGroup', totalUnits: { $sum: '$unitsCount' } } },
    { $sort: { _id: 1 } }
  ]);
};

BloodInventorySchema.statics.getExpiringItems = function(bloodBankId, days = 14) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    bloodBankId,
    status: { $in: ['available', 'reserved'] },
    expiryDate: { $lte: futureDate, $gt: today }
  }).sort({ expiryDate: 1 });
};

BloodInventorySchema.statics.getExpiredItems = function(bloodBankId) {
  const today = new Date();
  
  return this.find({
    bloodBankId,
    expiryDate: { $lte: today },
    status: { $ne: 'used' }
  }).sort({ expiryDate: 1 });
};

BloodInventorySchema.statics.checkSerialOverlap = function(bloodBankId, firstSerial, lastSerial, excludeId = null) {
  const query = {
    bloodBankId,
    $or: [
      {
        firstSerialNumber: { $lte: lastSerial },
        lastSerialNumber: { $gte: firstSerial }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.findOne(query);
};

// Virtual for serial range display
BloodInventorySchema.virtual('serialRange').get(function() {
  if (this.firstSerialNumber === this.lastSerialNumber) {
    return this.firstSerialNumber.toString();
  }
  return `${this.firstSerialNumber}-${this.lastSerialNumber}`;
});

// Virtual for expiry status
BloodInventorySchema.virtual('expiryStatus').get(function() {
  const days = this.getDaysUntilExpiry();
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 14) return 'warning';
  return 'good';
});

// Ensure virtuals are included in JSON output
BloodInventorySchema.set('toJSON', { virtuals: true });
BloodInventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BloodInventory', BloodInventorySchema);