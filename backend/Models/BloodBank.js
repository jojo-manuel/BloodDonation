const mongoose = require("mongoose");

const BloodBankSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function() {
      // userId is required only when status is approved
      return this.status === 'approved';
    }
    // unique constraint is handled in index definition below with sparse: true
  },
  name: {
    type: String,
    required: [true, "Blood bank name is required"],
    trim: true,
    minlength: [3, "Name must be at least 3 characters"],
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true,
    minlength: [3, "Address must be at least 3 characters"],
    maxlength: [300, "Address cannot exceed 300 characters"]
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
  },
  phone: {
    type: String,
    match: [/^[6-9]\d{9}$/, "Phone number must be a valid 10-digit Indian number"]
  },
  contactNumber: {
    type: String,
    match: [/^[6-9]\d{9}$/, "Contact number must be a valid 10-digit Indian number"]
  },
  hospitalName: {
    type: String,
    trim: true,
    maxlength: [100, "Hospital name cannot exceed 100 characters"]
  },
  pincode: {
    type: String,
    trim: true,
    match: [/^[0-9]{6}$/, "Pincode must be a valid 6-digit number"]
  },
  localBody: {
    type: String,
    trim: true,
    maxlength: [100, "Local body cannot exceed 100 characters"]
  },
  district: {
    type: String,
    trim: true,
    maxlength: [100, "District cannot exceed 100 characters"]
  },
  state: {
    type: String,
    trim: true,
    maxlength: [100, "State cannot exceed 100 characters"]
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  warningMessage: {
    type: String,
    default: null
  },
  suspendUntil: {
    type: Date,
    default: null
  },
  blockMessage: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Create indexes
BloodBankSchema.index({ userId: 1 }, { sparse: true, unique: true }); // Sparse unique index allows multiple nulls
BloodBankSchema.index({ status: 1 });
BloodBankSchema.index({ name: 1 });

module.exports = mongoose.model("BloodBank", BloodBankSchema);

