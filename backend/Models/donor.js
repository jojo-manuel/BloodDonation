// models/Donor.js
// Donor profile model containing personal, contact, and donation details.

const mongoose = require("mongoose");

// House Address Schema (nested inside Donor schema)
const HouseAddressSchema = new mongoose.Schema({
  houseName: { type: String, required: true, trim: true },
  houseAddress: { type: String, required: true, trim: true },
  localBody: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
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
  lastDonatedDate: { type: Date },
  priorityPoints: { type: Number, default: 0, min: 0 },
  donatedDates: [{ type: Date }]
}, { timestamps: true });

module.exports = mongoose.model("Donor", DonorSchema);



