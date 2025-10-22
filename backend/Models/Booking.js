const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: "BloodBank", required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., "10:00 AM"
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
  status: { type: String, enum: ["pending", "confirmed", "completed", "rejected", "cancelled"], default: "pending" },
  tokenNumber: { type: String }, // Assigned after confirmation
  donationRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "DonationRequest" }, // Link to the original request
  patientName: { type: String }, // Name of the patient
  donorName: { type: String }, // Name of the donor
  requesterName: { type: String }, // Name of the requester (username)
  bloodBankName: { type: String }, // Name of the blood bank
  bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] }, // Blood group
  patientMRID: { type: String }, // Patient's MRID
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
