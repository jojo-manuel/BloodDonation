// models/BloodBank.js
// Blood bank profile model managed by users with role "bloodbank".

const mongoose = require("mongoose");

const bloodBankSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, minlength: 3 },
    address: { type: String, required: true },
    district: { type: String, required: true },
    contactNumber: { type: String, required: true, match: /^[0-9]{10}$/ },
    licenseNumber: { type: String, required: true, unique: true }, // Example validation
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodBank", bloodBankSchema);