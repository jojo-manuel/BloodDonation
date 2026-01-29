const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  houseName: {
    type: String,
    required: true,
    trim: true
  },
  houseAddress: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  localBody: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const patientSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  mrid: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: addressSchema,
    required: true
  },
  requiredUnits: {
    type: Number,
    required: true,
    min: 1
  },
  receivedUnits: {
    type: Number,
    default: 0,
    min: 0
  },
  requiredDate: {
    type: Date,
    required: true
  },
  isFulfilled: {
    type: Boolean,
    default: false
  },
  hospital_id: {
    type: String,
    required: true
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
patientSchema.index({ hospital_id: 1, bloodGroup: 1 });
patientSchema.index({ mrid: 1 });
patientSchema.index({ hospital_id: 1, isFulfilled: 1 });

// Update isFulfilled status based on units
patientSchema.pre('save', function(next) {
  this.isFulfilled = this.receivedUnits >= this.requiredUnits;
  next();
});

module.exports = mongoose.model('Patient', patientSchema);