// controllers/authController.js
// Handles user registration, login, token refresh, and logout.

const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../middleware/asyncHandler");

/**
 * Create a short-lived access token used for API authorization
 * @param {import('../Models/User')} user - Mongoose user document
 */
function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
}

/**
 * Create a long-lived refresh token used to obtain new access tokens
 * @param {import('../Models/User')} user - Mongoose user document
 */
function signRefreshToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

// In-memory refresh token store (replace with DB or cache in production)
const refreshStore = new Map();

/**
 * Register a new user
 * Body: { name, email, password, role }
 */
exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Ensure email uniqueness
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already exists' });
  }

  // Create user (password hashing occurs in model pre-save hook)
  const user = await User.create({ name, email, password, role });

  // Issue tokens
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  refreshStore.set(String(user._id), refreshToken);

  return res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken },
  });
});

/**
 * Login user
 * Body: { email, password }
 */
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(400).json({ success: false, message: 'Invalid credentials' });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  refreshStore.set(String(user._id), refreshToken);

  return res.json({
    success: true,
    message: 'Logged in',
    data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken },
  });
});

/**
 * Refresh access token using refresh token
 * Body: { refreshToken }
 */
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const stored = refreshStore.get(String(payload.id));
    if (stored !== refreshToken) throw new Error('Invalid refresh token');

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const newAccess = signAccessToken(user);
    const newRefresh = signRefreshToken(user);
    refreshStore.set(String(user._id), newRefresh);
    return res.json({ success: true, message: 'Refreshed', data: { accessToken: newAccess, refreshToken: newRefresh } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

/**
 * Logout user by invalidating refresh token
 * Body: { userId }
 */
exports.logout = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (userId) refreshStore.delete(String(userId));
  return res.json({ success: true, message: 'Logged out', data: null });
});