const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
      match: [/^[A-Za-z\s]+$/, "Name must only contain letters and spaces"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters long"],
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: {
        values: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        message: "{VALUE} is not a valid blood group",
      },
    },
    mrid: {
      type: String,
      required: [true, "MRID (Medical Record ID) is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [5, "MRID must be at least 5 characters long"],
      maxlength: [15, "MRID cannot exceed 15 characters"],
      match: [/^[A-Z0-9]+$/, "MRID must be alphanumeric and uppercase"],
    },
    unitsRequired: {
      type: Number,
      required: [true, "Units required is mandatory"],
      min: [1, "At least 1 unit is required"],
      max: [10, "Cannot request more than 10 units at once"],
      validate: {
        validator: Number.isInteger,
        message: "Units required must be an integer",
      },
    },
    dateNeeded: {
      type: Date,
      required: [true, "Date at which blood is needed is required"],
      validate: {
        validator: function (v) {
          return v >= new Date().setHours(0, 0, 0, 0);
        },
        message: "Date needed must be today or in the future",
      },
    },
    requestDate: {
      type: Date,
      default: Date.now,
      immutable: true, // Prevents modification after creation
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [100, "Email cannot exceed 100 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    emergencyContact: {
      name: {
        type: String,
        required: [true, "Emergency contact name is required"],
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [50, "Name cannot exceed 50 characters"],
        match: [/^[A-Za-z\s]+$/, "Name must only contain letters and spaces"],
      },
      phone: {
        type: String,
        required: [true, "Emergency contact phone number is required"],
        match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
      },
      relation: {
        type: String,
        required: [true, "Relation to patient is required"],
        minlength: [3, "Relation must be at least 3 characters long"],
        maxlength: [30, "Relation cannot exceed 30 characters"],
        match: [/^[A-Za-z\s]+$/, "Relation must only contain letters and spaces"],
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DonorSearchPatient", patientSchema);
