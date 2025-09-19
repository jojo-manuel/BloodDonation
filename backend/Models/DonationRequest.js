const mongoose = require("mongoose");

const DonationRequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin or blood bank requesting
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" }, // Patient for whom the blood is needed
  bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: "BloodBank" }, // Blood bank associated with the patient
  status: { type: String, enum: ["pending", "accepted", "rejected", "booked"], default: "pending" },
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
  userPhone: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("DonationRequest", DonationRequestSchema);
