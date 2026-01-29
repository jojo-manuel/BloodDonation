const mongoose = require('mongoose');

const bloodComponentSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['red_cells', 'plasma', 'platelets', 'white_cells', 'cryoprecipitate']
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  volume: {
    type: Number,
    required: true,
    min: 1
  },
  // Link to original blood bag
  originalBagId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBag',
    required: true
  },
  originalBagSerial: {
    type: String,
    required: true
  },
  // Separation details
  separationDate: {
    type: Date,
    required: true
  },
  separatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  separationMethod: {
    type: String,
    required: true,
    enum: ['centrifugation', 'apheresis', 'filtration']
  },
  // Status and quality
  status: {
    type: String,
    required: true,
    enum: ['available', 'reserved', 'used', 'expired', 'quarantine', 'discarded'],
    default: 'available'
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'rejected'],
    default: 'A'
  },
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
  // Expiry information (varies by component type)
  expiryDate: {
    type: Date
  },
  // Storage information
  storageLocation: {
    type: String,
    trim: true
  },
  storageTemperature: {
    type: String
  },
  // Usage tracking
  usedBy: {
    type: String,
    trim: true
  },
  usedFor: {
    type: String,
    trim: true
  },
  usedAt: {
    type: Date
  },
  department: {
    type: String,
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  // Hospital and location
  hospital_id: {
    type: String,
    required: true
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
bloodComponentSchema.index({ serialNumber: 1 });
bloodComponentSchema.index({ hospital_id: 1, type: 1 });
bloodComponentSchema.index({ hospital_id: 1, status: 1 });
bloodComponentSchema.index({ hospital_id: 1, bloodGroup: 1 });
bloodComponentSchema.index({ originalBagId: 1 });
bloodComponentSchema.index({ separationDate: -1 });
bloodComponentSchema.index({ expiryDate: 1 });

// Set expiry date based on component type before saving
bloodComponentSchema.pre('save', function(next) {
  console.log('Pre-save middleware triggered for component:', this.serialNumber);
  console.log('Current expiryDate:', this.expiryDate);
  console.log('Current separationDate:', this.separationDate);
  console.log('Current type:', this.type);
  
  if (!this.expiryDate && this.separationDate) {
    console.log('Calculating expiry date...');
    const separationDate = new Date(this.separationDate);
    let expiryDays;
    
    // Set expiry days based on component type
    switch (this.type) {
      case 'red_cells':
        expiryDays = 42; // 42 days for red blood cells
        this.storageTemperature = this.storageTemperature || '2-6°C';
        break;
      case 'plasma':
        expiryDays = 365; // 1 year for frozen plasma
        this.storageTemperature = this.storageTemperature || '-18°C';
        break;
      case 'platelets':
        expiryDays = 5; // 5 days for platelets
        this.storageTemperature = this.storageTemperature || '20-24°C';
        break;
      case 'white_cells':
        expiryDays = 1; // 24 hours for white blood cells
        this.storageTemperature = this.storageTemperature || '2-6°C';
        break;
      case 'cryoprecipitate':
        expiryDays = 365; // 1 year for frozen cryoprecipitate
        this.storageTemperature = this.storageTemperature || '-18°C';
        break;
      default:
        expiryDays = 35; // Default
    }
    
    this.expiryDate = new Date(separationDate.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    console.log('Calculated expiry date:', this.expiryDate);
  } else {
    console.log('Skipping expiry date calculation - expiryDate already set or separationDate missing');
  }
  next();
});

// Virtual for checking if component is expired
bloodComponentSchema.virtual('isExpired').get(function() {
  return this.expiryDate && new Date() > this.expiryDate;
});

// Virtual for checking if component is expiring soon (within 7 days for most, 1 day for platelets)
bloodComponentSchema.virtual('isExpiringSoon').get(function() {
  if (!this.expiryDate) return false;
  
  let warningDays;
  switch (this.type) {
    case 'platelets':
      warningDays = 1; // 1 day warning for platelets
      break;
    case 'white_cells':
      warningDays = 0.5; // 12 hours warning for white cells
      break;
    default:
      warningDays = 7; // 7 days warning for others
  }
  
  const warningTime = new Date(Date.now() + (warningDays * 24 * 60 * 60 * 1000));
  return this.expiryDate <= warningTime && this.expiryDate > new Date();
});

// Virtual for component display name
bloodComponentSchema.virtual('displayName').get(function() {
  const names = {
    'red_cells': 'Red Blood Cells',
    'plasma': 'Plasma',
    'platelets': 'Platelets',
    'white_cells': 'White Blood Cells',
    'cryoprecipitate': 'Cryoprecipitate'
  };
  return names[this.type] || this.type;
});

module.exports = mongoose.model('BloodComponent', bloodComponentSchema);