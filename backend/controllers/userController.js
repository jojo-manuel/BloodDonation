const User = require('../Models/User');
const Donor = require('../Models/donor');
const asyncHandler = require('../middleware/asyncHandler');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Multer storage for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Dev-friendly secrets (use .env in production)
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}
function signRefreshToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

async function ensureUniqueUsername(base) {
  let candidate = base;
  let i = 0;
  // Try base, then base_1, base_2, ... until free
  // Cap attempts to avoid infinite loop
  while (i < 1000) {
    const exists = await User.findOne({ username: candidate }).lean();
    if (!exists) return candidate;
    i += 1;
    candidate = `${base}_${i}`;
  }
  // Fallback with timestamp
  return `${base}_${Date.now()}`;
}

/**
 * Register a new user
 * Body: username, password, role (optional, defaults to 'user'), name, email, phone
 */
exports.register = asyncHandler(async (req, res) => {
  try {
    const { username, password, role = 'user', name, email, phone } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const normalizedRole = String(role).toLowerCase();
    if (!["user", "donor", "bloodbank"].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: "Role must be user, donor, or bloodbank" });
    }

    if (username.length < 3) {
      return res.status(400).json({ success: false, message: "Username too short" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ success: false, message: "Username can only contain letters, numbers, and underscores" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password too short" });
    }

    // Ensure unique username (auto-suffix if taken)
    const uniqueUsername = await ensureUniqueUsername(username);

    // Let the model hash the password in pre-save hook (avoid double hash)
    const newUser = new User({
      username: uniqueUsername,
      password,
      role: normalizedRole,
      name: name || uniqueUsername.split('@')[0], // Use part of email as name if not provided
      email: email || uniqueUsername, // Use username as email if not provided
      phone: phone || null
    });
    await newUser.save();

    // Issue tokens
    const accessToken = signAccessToken(newUser);
    const refreshToken = signRefreshToken(newUser);

    // Respond with user info and tokens
    res.status(201).json({
      success: true,
      message: "User registered",
      data: {
        user: { id: newUser._id, username: newUser.username, role: newUser.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});

/**
 * Get current authenticated user's profile
 * Requires: req.user.id (set by auth middleware)
 */
exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'OK', data: user });
});

/**
 * Update current authenticated user's profile
 * Body fields supported: name, phone, address
 */
exports.updateMe = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.phone !== undefined) updates.phone = req.body.phone;
  if (req.body.address !== undefined) updates.address = req.body.address;

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  res.json({ success: true, message: 'Profile updated', data: user });
});

/**
 * Complete profile for Google users
 * Body: name, phone
 */
exports.completeProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required' });
  }

  const updates = { name, phone, needsProfileCompletion: false };
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  res.json({ success: true, message: 'Profile completed', data: user });
});

/**
 * Update donor availability status
 */
exports.updateDonorAvailability = asyncHandler(async (req, res) => {
  const { id } = req.user; // user id from auth middleware
  const { availability } = req.body;

  if (typeof availability !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: "Invalid value for availability. Must be boolean."
    });
  }

  const donor = await Donor.findOneAndUpdate(
    { userId: id },
    { availability },
    { new: true }
  );

  if (!donor) {
    return res.status(404).json({
      success: false,
      message: "Donor not found for the current user."
    });
  }

  res.json({
    success: true,
    message: "Donor availability updated successfully.",
    data: donor
  });
});

/**
 * Upload profile image
 */
exports.uploadProfileImage = [
  upload.single('profileImage'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded."
      });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imagePath },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: "Profile image uploaded successfully.",
      data: user
    });
  })
];
