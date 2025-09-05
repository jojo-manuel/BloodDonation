const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters long"],
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    mrid: {
      type: String,
      required: [true, "MRID (Medical Record ID) is required"],
      unique: true,
      match: [/^[A-Z0-9]+$/, "MRID must be alphanumeric and uppercase"],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
