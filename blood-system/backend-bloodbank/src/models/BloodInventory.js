const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    trim: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: false
  },
  donationType: {
    type: String,
    enum: ['whole_blood', 'plasma', 'platelets', 'red_cells', 'white_cells'],
    default: 'whole_blood',
    required: false
  },
  serialNumber: {
    type: String,
    required: true,
    trim: true
  },
  unitsCount: {
    type: Number,
    default: 1
  },
  collectionDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  donorName: {
    type: String,
    trim: true,
    required: false
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'reserved', 'used', 'expired', 'quarantine'],
    default: 'available'
  },
  location: {
    type: String,
    trim: true
  },
  temperature: {
    type: String,
    default: '2-6°C'
  },
  notes: {
    type: String,
    trim: true
  },
  hospital_id: {
    type: String,
    required: true
  },
  // Allocation/Assignment fields
  allocatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  allocatedAt: {
    type: Date
  },
  allocationNotes: {
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
bloodInventorySchema.index({ hospital_id: 1, bloodGroup: 1 });
bloodInventorySchema.index({ hospital_id: 1, status: 1 });
bloodInventorySchema.index({ expiryDate: 1 });
bloodInventorySchema.index({ hospital_id: 1, serialNumber: 1 });

module.exports = mongoose.model('BloodInventory', bloodInventorySchema, 'bloodunits');