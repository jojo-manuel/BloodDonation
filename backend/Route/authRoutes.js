// routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const admin = require("../utils/firebaseAdmin");

const User = require("../Models/User");
const Activity = require("../Models/Activity");
const { sendEmail } = require("../utils/email");

// Create router
const router = express.Router();

// Secrets (use .env in production)
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// ====== Helper functions ======
function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

// In-memory refresh token store (dev only)
const refreshStore = new Map();

function deriveUsernameFromEmail(email) {
  const local = String(email || "").split("@")[0] || "user";
  let u = local
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (u.length < 3) u = (u + "123").slice(0, 3);
  return u;
}

async function ensureUniqueUsername(base) {
  let candidate = base;
  let i = 0;
  while (i < 1000) {
    const exists = await User.findOne({ username: candidate }).lean();
    if (!exists) return candidate;
    i += 1;
    candidate = `${base}_${i}`;
  }
  return `${base}_${Date.now()}`;
}

// Firebase authentication setup - Google OAuth removed

// ====== Routes ======

/**
 * @route   GET /api/auth/google
 * @desc    Google OAuth removed - use Firebase instead
 */
router.get("/google", (req, res) => {
  return res.status(410).json({ success: false, message: "Google OAuth has been replaced with Firebase authentication" });
});

// ====== Forgot Password Route ======
router.post('/forgot-password', async (req, res) => {
  const { email, username } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: email || null }, { username: username || null }]
    });
    if (!user) {
      // Do not reveal user existence for security
      return res.json({ success: true, message: 'If the account exists, a reset link has been sent' });
    }

    // Generate reset token and expiry (1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiry;
    await user.save();

    // Send password reset email using Firebase Admin SDK
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const message = {
      notification: {
        title: 'Password Reset Request',
        body: `You requested a password reset. Click the link to reset your password.`,
      },
      data: {
        resetUrl,
      },
      token: user.firebaseToken, // Assuming you store Firebase device tokens for users
    };

    try {
      await admin.messaging().send(message);
      return res.json({ success: true, message: 'If the account exists, a reset link has been sent' });
    } catch (firebaseErr) {
      console.error('Firebase send message error:', firebaseErr);
      return res.status(500).json({ success: false, message: 'Failed to send reset notification' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send reset notification' });
  }
});

// ====== Reset Password Route ======
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback removed - use Firebase instead
 */
router.get("/google/callback", (req, res) => {
  return res.status(410).json({ success: false, message: "Google OAuth has been replaced with Firebase authentication" });
});

const validate = require('../Middleware/validate');
const { registerBody, loginBody, forgotPasswordBody, resetPasswordBody, firebaseAuthBody } = require('../validators/schemas');
const { z } = require('zod');

// ====== Local Auth (Register/Login/Refresh/Logout) ======

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with validation and password hashing
 */
router.post("/register", async (req, res) => {
  try {
    console.log('Registration request received. Body:', req.body);
    // Validate request body using zod schema
    const parsed = registerBody.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      console.log('Registration validation failed. Request body:', req.body);
      console.log('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: errors,
      });
    }

    console.log('Validation passed. Parsed data:', parsed.data);

    const data = parsed.data;
    let username, name, email;

    if (data.username) {
      // localByUsername schema - username should be in email format
      username = data.username;
      name = data.name || data.username; // Use provided name or username as name
      email = data.email || data.username; // Use provided email or username as email
    } else {
      // localByEmail schema - use email as username
      name = data.name;
      email = data.email;
      username = data.email; // Use email as username
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('User already exists with username:', username);
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const { password, role, provider } = data;

    // Password will be hashed by the User model pre-save hook

    // Create new user document
    const userData = {
      username,
      name,
      role: role || "user",
      provider: provider || "local",
    };

    if (email) userData.email = email;
    if (password) userData.password = password;

    console.log('Creating user with data:', userData);
    const newUser = new User(userData);
    console.log('User created, saving...');
    await newUser.save();
    console.log('User saved successfully');

    // Log registration activity
    await Activity.create({
      userId: newUser._id,
      role: newUser.role,
      action: 'register',
      details: { provider: newUser.provider }
    });

    return res.status(201).json({
      success: true,
      message: provider === 'google' ? "User registered successfully (Google)" : "User registered successfully",
      data: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    let { username, email, password } = req.body || {};
    if (!username && email) username = email; // Use email directly as username
    if (!username || !password)
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });

    // Add max retry and catch for admin user existence check
    let user;
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        user = await User.findOne({ username });
        break;
      } catch (e) {
        attempts++;
        if (attempts >= maxAttempts) {
          return res.status(500).json({ success: false, message: "Error checking user existence", error: e.message });
        }
      }
    }

    if (!user)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Remove admin login block
    // if (user.role === 'admin') {
    //   return res.status(403).json({ success: false, message: 'Admin login is disabled' });
    // }

    // Check blood bank rejection status if user is a blood bank
    if (user.role === 'bloodbank') {
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: user._id });
      if (bloodBank && bloodBank.status === 'rejected') {
        return res.status(403).json({ success: false, message: "Your blood bank registration has been rejected. Please contact admin." });
      }
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: user.blockMessage || "Your account has been blocked." });
    }

    // Check suspension status
    if (user.isSuspended) {
      if (user.suspendUntil && new Date() >= user.suspendUntil) {
        // Suspension period has ended, automatically unsuspend
        user.isSuspended = false;
        user.suspendUntil = null;
        await user.save();
      } else {
        // Still suspended
        const message = user.suspendUntil ? `Your account is suspended until ${user.suspendUntil.toISOString().split('T')[0]}.` : "Your account is suspended.";
        return res.status(403).json({ success: false, message });
      }
    }

    // Handle warnings
    let warningMsg = null;
    if (user.warningCount > 0) {
      warningMsg = user.warningMessage || "You have a warning.";
      user.warningCount -= 1;
      await user.save();
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    refreshStore.set(String(user._id), refreshToken);

    // Log login activity
    await Activity.create({
      userId: user._id,
      role: user.role,
      action: 'login',
      details: { method: 'local' }
    });

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          isSuspended: user.isSuspended || false,
          isBlocked: user.isBlocked || false,
          warningMessage: warningMsg
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Login failed", error: err.message });
  }
});

/**
 * @route   POST /api/auth/refresh
 */
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken)
    return res.status(401).json({ success: false, message: "No refresh token" });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    const user = await User.findById(payload.id);
    if (!user)
      return res.status(401).json({ success: false, message: "User not found" });

    // Check if user is blocked or suspended
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: user.blockMessage || "Your account has been blocked." });
    }

    if (user.isSuspended) {
      if (user.suspendUntil && new Date() >= user.suspendUntil) {
        user.isSuspended = false;
        user.suspendUntil = null;
        await user.save();
      } else {
        const message = user.suspendUntil ? `Your account is suspended until ${user.suspendUntil.toISOString().split('T')[0]}.` : "Your account is suspended.";
        return res.status(403).json({ success: false, message });
      }
    }

    const newAccess = signAccessToken(user);
    const newRefresh = signRefreshToken(user);
    refreshStore.set(String(user._id), newRefresh);

    return res.json({
      success: true,
      message: "Refreshed",
      data: { accessToken: newAccess, refreshToken: newRefresh },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
});

/**
 * @route   POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  const { userId } = req.body || {};
  if (userId) refreshStore.delete(String(userId));
  return res.json({ success: true, message: "Logged out" });
});

/**
 * @route   POST /api/auth/google-login
 * @desc    Authenticate with Google OAuth via Firebase
 */
router.post("/google-login", async (req, res) => {
  try {
    const { email, uid, displayName } = req.body;
    if (!email || !uid) {
      return res.status(400).json({ success: false, message: "Email and UID are required" });
    }

    // Find or create user
    let user = await User.findOne({ firebaseId: uid });
    if (!user) {
      // Check if user exists by email
      user = await User.findOne({ email });
      if (user) {
        // Update existing user with firebaseId
        user.firebaseId = uid;
        user.provider = 'google';
        if (displayName && !user.name) {
          user.name = displayName;
        }
        await user.save();
      } else {
        // Create new user
        const username = email; // Use email as username since it must be email format
        user = new User({
          username,
          name: displayName || email.split('@')[0],
          email,
          role: "user", // Default role, will be updated if blood bank exists
          firebaseId: uid,
          provider: 'google',
        });
        await user.save();
      }
    }

    // Check if user is a blood bank and update role accordingly
    if (user.role === "user") {
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: user._id });
      if (bloodBank) {
        user.role = "bloodbank";
        await user.save();
      }
    }

    // Check blood bank rejection status if user is a blood bank
    if (user.role === 'bloodbank') {
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: user._id });
      if (bloodBank && bloodBank.status === 'rejected') {
        return res.status(403).json({ success: false, message: "Your blood bank registration has been rejected. Please contact admin." });
      }
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: user.blockMessage || "Your account has been blocked." });
    }

    // Check suspension status
    if (user.isSuspended) {
      if (user.suspendUntil && new Date() >= user.suspendUntil) {
        // Suspension period has ended, automatically unsuspend
        user.isSuspended = false;
        user.suspendUntil = null;
        await user.save();
      } else {
        // Still suspended
        const message = user.suspendUntil ? `Your account is suspended until ${user.suspendUntil.toISOString().split('T')[0]}.` : "Your account is suspended.";
        return res.status(403).json({ success: false, message });
      }
    }

    // Handle warnings
    let warningMsg = null;
    if (user.warningCount > 0) {
      warningMsg = user.warningMessage || "You have a warning.";
      user.warningCount -= 1;
      await user.save();
    }

    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    refreshStore.set(String(user._id), refreshToken);

    // Log google login activity
    await Activity.create({
      userId: user._id,
      role: user.role,
      action: 'login',
      details: { method: 'google' }
    });

    return res.json({
      success: true,
      message: "Authenticated with Google",
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          isSuspended: user.isSuspended || false,
          isBlocked: user.isBlocked || false,
          warningMessage: warningMsg
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(500).json({ success: false, message: "Google login failed", error: err.message });
  }
});

/**
 * @route   POST /api/auth/verify-login
 * @desc    Verify login code and issue tokens
 */
router.post("/verify-login", async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ success: false, message: "User ID and code are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.emailVerificationCode !== code || !user.emailVerificationExpires || user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    // Clear verification fields
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Check blood bank rejection status if user is a blood bank
    if (user.role === 'bloodbank') {
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: user._id });
      if (bloodBank && bloodBank.status === 'rejected') {
        return res.status(403).json({ success: false, message: "Your blood bank registration has been rejected. Please contact admin." });
      }
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: user.blockMessage || "Your account has been blocked." });
    }

    // Check suspension status
    if (user.isSuspended) {
      if (user.suspendUntil && new Date() >= user.suspendUntil) {
        // Suspension period has ended, automatically unsuspend
        user.isSuspended = false;
        user.suspendUntil = null;
        await user.save();
      } else {
        // Still suspended
        const message = user.suspendUntil ? `Your account is suspended until ${user.suspendUntil.toISOString().split('T')[0]}.` : "Your account is suspended.";
        return res.status(403).json({ success: false, message });
      }
    }

    // Handle warnings
    let warningMsg = null;
    if (user.warningCount > 0) {
      warningMsg = user.warningMessage || "You have a warning.";
      user.warningCount -= 1;
      await user.save();
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    refreshStore.set(String(user._id), refreshToken);

    // Log login activity
    await Activity.create({
      userId: user._id,
      role: user.role,
      action: 'login',
      details: { method: 'local' }
    });

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          isSuspended: user.isSuspended || false,
          isBlocked: user.isBlocked || false,
          warningMessage: warningMsg
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('Verify login error:', err);
    return res.status(500).json({ success: false, message: "Verification failed", error: err.message });
  }
});

/**
 * @route   POST /api/auth/firebase
 * @desc    Authenticate with Firebase ID token
 */
router.post("/firebase", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "ID token is required" });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required from Firebase token" });
    }

    // Find or create user
    let user = await User.findOne({ firebaseId: uid });
    if (!user) {
      // Check if user exists by email
      user = await User.findOne({ email });
      if (user) {
        // Update existing user with firebaseId
        user.firebaseId = uid;
        user.provider = 'firebase';
        await user.save();
      } else {
        // Create new user
        const username = email; // Use email as username since it must be email format
        user = new User({
          username,
          name: name || email.split('@')[0],
          email,
          role: "user",
          firebaseId: uid,
          provider: 'firebase',
        });
        await user.save();
      }
    }

    // Check if user is a blood bank and update role accordingly
    if (user.role === "user") {
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: user._id });
      if (bloodBank) {
        user.role = "bloodbank";
        await user.save();
      }
    }

    // Check blood bank rejection status if user is a blood bank
    if (user.role === 'bloodbank') {
      const BloodBank = require("../Models/BloodBank");
      const bloodBank = await BloodBank.findOne({ userId: user._id });
      if (bloodBank && bloodBank.status === 'rejected') {
        return res.status(403).json({ success: false, message: "Your blood bank registration has been rejected. Please contact admin." });
      }
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: user.blockMessage || "Your account has been blocked." });
    }

    // Check suspension status
    if (user.isSuspended) {
      if (user.suspendUntil && new Date() >= user.suspendUntil) {
        // Suspension period has ended, automatically unsuspend
        user.isSuspended = false;
        user.suspendUntil = null;
        await user.save();
      } else {
        // Still suspended
        const message = user.suspendUntil ? `Your account is suspended until ${user.suspendUntil.toISOString().split('T')[0]}.` : "Your account is suspended.";
        return res.status(403).json({ success: false, message });
      }
    }

    // Handle warnings
    let warningMsg = null;
    if (user.warningCount > 0) {
      warningMsg = user.warningMessage || "You have a warning.";
      user.warningCount -= 1;
      await user.save();
    }

    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    refreshStore.set(String(user._id), refreshToken);

    // Log firebase login activity
    await Activity.create({
      userId: user._id,
      role: user.role,
      action: 'login',
      details: { method: 'firebase' }
    });

    return res.json({
      success: true,
      message: "Authenticated with Firebase",
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          isSuspended: user.isSuspended || false,
          isBlocked: user.isBlocked || false,
          warningMessage: warningMsg
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('Firebase auth error:', err);
    return res.status(401).json({ success: false, message: "Invalid Firebase token" });
  }
});

module.exports = router;
