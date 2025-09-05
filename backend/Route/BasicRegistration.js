// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs"); // For password hashing
const jwt = require("jsonwebtoken"); // For generating authentication tokens
const User = require("../Models/User"); // User model

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Blood Bank or User)
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // 1. Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // 2. Normalize and validate role
    const normalizedRole = String(role).toLowerCase();
    const allowedRoles = ["bloodbank", "user", "donor"];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: "Role must be user, donor, or bloodbank" });
    }

    // 3. Validate username length and format
    if (username.length < 3) {
      return res.status(400).json({ success: false, message: "Username must be at least 3 characters long" });
    }

    // 4. Validate password length
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // 5. Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    // 6. Create new user object (password hashing occurs in model pre-save hook)
    const newUser = new User({
      username,
      password,
      role: normalizedRole,
    });

    // 7. Save user in database
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
      process.env.JWT_SECRET,
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

module.exports = router;
