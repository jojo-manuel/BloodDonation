const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    bloodBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodBank",
      required: true,
    },
    bloodBankName: {
      type: String,
      required: [true, "Blood bank name is required"],
    },
    name: {
      type: String,
      required: [true, "Patient name is required"],
    },
    address: {
      houseName: { type: String },
      houseAddress: { type: String },
      localBody: { type: String },
      city: { type: String },
      district: { type: String },
      state: { type: String },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        validate: {
          validator: function(v) {
            return /^[0-9]{6}$/.test(v);
          },
          message: "Pincode must be a valid 6-digit number"
        }
      }
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    mrid: {
      type: String,
      required: [true, "MRID is required"],
      uppercase: true, // Store MRID in uppercase
    },
    encryptedMrid: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
    },
    unitsRequired: {
      type: Number,
      required: [true, "Units required is mandatory"],
      min: [1, "At least 1 unit is required"],
    },
    dateNeeded: {
      type: Date,
      required: [true, "Date at which blood is needed is required"],
      validate: {
        validator: function (v) {
          return v >= new Date();
        },
        message: "Date needed must be today or in the future",
      },
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
