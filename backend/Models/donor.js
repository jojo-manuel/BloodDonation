// models/Donor.js
// Donor profile model containing personal, contact, and donation details.

const mongoose = require("mongoose");

// House Address Schema (nested inside Donor schema)
const HouseAddressSchema = new mongoose.Schema({
  houseName: { type: String, required: true, trim: true },
  houseAddress: { type: String, trim: true }, // Made optional - will be auto-filled from API
  localBody: { type: String, trim: true }, // Made optional - will be auto-filled from API
  city: { type: String, trim: true }, // Made optional - will be auto-filled from API
  district: { type: String, trim: true }, // Made optional - will be auto-filled from API
  state: { type: String, trim: true }, // Added state field - will be auto-filled from API
  pincode: {
    type: String,
    required: true,
    match: [/^[0-9]{6}$/, "Invalid pincode. Must be 6 digits"]
  }
});

// Donor Schema
const DonorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link to user login
  name: { type: String, required: true, trim: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  bloodGroup: { 
    type: String, 
    required: true, 
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] 
  },
  contactNumber: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[0-9]{10}$/, "Contact number must be 10 digits"] 
  },
  emergencyContactNumber: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, "Emergency contact must be 10 digits"],
    validate: {
      validator: function (v) {
        return v !== this.contactNumber; // Ensure different numbers
      },
      message: "Emergency contact cannot be same as contact number"
    }
  },
  houseAddress: { type: HouseAddressSchema, required: true },
  workAddress: { type: String, required: true },
  weight: { type: Number, required: true, min: [55.1, "Weight must be above 55kg"] },
  availability: { type: Boolean, default: true },
  contactPreference: { type: String, enum: ["phone", "email"], default: "phone" },
  phone: { type: String },
  bloodBankName: { type: String }, // Name of the associated blood bank
  lastDonatedDate: { type: Date },
  priorityPoints: { type: Number, default: 0, min: 0 },
  donatedDates: [{ type: Date }],
  isBlocked: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  // Location coordinates for smart matching (optional)
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  warningMessage: { type: String, default: null },
  warningCount: { type: Number, default: 0 },
  suspendUntil: { type: Date, default: null },
  blockMessage: { type: String, default: null }
}, { timestamps: true });

// Create unique index on userId to prevent duplicate donor registrations per user
DonorSchema.index({ userId: 1 }, { unique: true });

const Donor = mongoose.model("Donor", DonorSchema);

module.exports = Donor;
