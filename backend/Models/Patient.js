const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../utils/encryption");

const patientSchema = new mongoose.Schema(
  {
    bloodBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodBank",
      required: true,
    },
    encryptedName: {
      type: String,
      required: [true, "Encrypted patient name is required"],
    },
    encryptedAddress: {
      type: String,
      required: [true, "Encrypted address is required"],
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    encryptedMrid: {
      type: String,
      required: [true, "Encrypted MRID is required"],
      unique: true,
    },
    encryptedPhoneNumber: {
      type: String,
      required: [true, "Encrypted phone number is required"],
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

// Virtual for decrypted name
patientSchema.virtual('name').get(function() {
  return this.encryptedName ? decrypt(this.encryptedName) : '';
}).set(function(value) {
  this.encryptedName = encrypt(value);
});

// Virtual for decrypted address
patientSchema.virtual('address').get(function() {
  return this.encryptedAddress ? decrypt(this.encryptedAddress) : '';
}).set(function(value) {
  this.encryptedAddress = encrypt(value);
});

  
// Virtual for decrypted phone number
patientSchema.virtual('phoneNumber').get(function() {
  return this.encryptedPhoneNumber ? decrypt(this.encryptedPhoneNumber) : '';
}).set(function(value) {
  this.encryptedPhoneNumber = encrypt(value);
});

// Ensure virtual fields are serialized
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });


// Virtual for decrypted MRID
patientSchema.virtual('mrid').get(function() {
  return this.encryptedMrid ? decrypt(this.encryptedMrid) : '';
}).set(function(value) {
  // store uppercase MRID for consistency
  const normalized = (value || '').toString().toUpperCase();
  this.encryptedMrid = encrypt(normalized);
});


module.exports = mongoose.model("Patient", patientSchema);
