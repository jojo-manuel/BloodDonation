const mongoose = require("mongoose");

const BloodBankSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
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
  district: {
    type: String,
    trim: true
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
BloodBankSchema.index({ userId: 1 });
BloodBankSchema.index({ status: 1 });
BloodBankSchema.index({ name: 1 });

module.exports = mongoose.model("BloodBank", BloodBankSchema);

