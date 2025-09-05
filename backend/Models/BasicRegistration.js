// models/User.js
const mongoose = require("mongoose");

// User schema to store username, password, and role
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,   // Cannot be empty
      unique: true,     // Each username must be unique
      minlength: 3,     // Minimum 3 characters
    },
    password: {
      type: String,
      required: true,   // Cannot be empty
      minlength: 6,     // Minimum 6 characters
    },
    role: {
      type: String,
      enum: ["bloodbank", "user"], // Only allow these two roles
      required: true,
    },
  },
  { timestamps: true } // Automatically add createdAt & updatedAt
);

module.exports = mongoose.model("User", userSchema);
