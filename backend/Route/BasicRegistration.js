// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs"); // For password hashing
const jwt = require("jsonwebtoken"); // For generating authentication tokens
const Donor = require("../Models/donor"); // Donor model
const User = require("../Models/User"); // User model

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Blood Bank or User)
 * @access  Public
 */
const { registerBody } = require('../validators/schemas');
const { z } = require('zod');

router.post("/register", async (req, res) => {
  try {
    // Validate request body using zod schema
    const parsed = registerBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Validation failed", details: parsed.error.errors });
    }
    const { username, email, password, role, provider, name } = parsed.data;

    // Check if user exists by username or email
    let existingUser = null;
    if (username) existingUser = await User.findOne({ username });
    else if (email) existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Create new user object
    const newUser = new User({
      username,
      email,
      password,
      role: role || 'user',
      provider,
      name,
    });

    // Save user in database
    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login a user and return a JWT token
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validate input
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // 2. Check if user exists in DB
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // 3. Compare entered password using model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // 4. Generate JWT token with payload
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    // 5. Send token + user role in response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

/**
 * @route   POST /api/auth/convert-to-donor
 * @desc    Convert a user to donor role
 * @access  Private
 */
router.post("/convert-to-donor", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update role to donor
    user.role = "donor";
    await user.save();

    // Create donor profile if not exists
    const existingDonor = await Donor.findOne({ userId: user._id });
    if (!existingDonor) {
      await Donor.create({ userId: user._id, name: user.username });
    }

    res.status(200).json({ success: true, message: "User converted to donor successfully" });
  } catch (error) {
    console.error("Convert to Donor Error:", error);
    res.status(500).json({ success: false, message: "Server error during role conversion" });
  }
});

module.exports = router;
