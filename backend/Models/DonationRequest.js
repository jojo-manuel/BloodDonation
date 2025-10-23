const mongoose = require("mongoose");

const DonationRequestSchema = new mongoose.Schema({
  // New fields per requirement
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  donorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User ID of the donor
  bloodBankName: { type: String }, // Name of the blood bank issuing the request
  bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], required: true },
  issuedAt: { type: Date },
  isActive: { type: Boolean, default: true },

  // Existing fields (kept for compatibility with donor flows)
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin or blood bank requesting
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" }, // Patient for whom the blood is needed
  bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: "BloodBank" }, // Blood bank associated with the patient
  status: { type: String, enum: ["pending", "pending_booking", "accepted", "rejected", "booked", "cancelled", "completed"], default: "pending" },
  message: { type: String, default: "We urgently need your blood donation. Please consider donating." },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  requestedDate: { type: Date }, // Date requested for donation
  requestedTime: { type: String }, // Time requested for donation
  tokenNumber: { type: String }, // Token number assigned after approval
  // Direct storage fields for usernames and details
  requesterUsername: { type: String },
  donorUsername: { type: String },
  bloodBankUsername: { type: String },
  bloodBankAddress: { type: String },
  patientUsername: { type: String },
  patientMRID: { type: String }, // Patient MRID for easy display
  userPhone: { type: String },
  // Link to booking when slot is booked
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
}, { timestamps: true });

module.exports = mongoose.model("DonationRequest", DonationRequestSchema);
