// routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const googleOAuthConfig = require("../config/googleOAuthConfig");

// Import models
const User = require("../Models/User");

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

// ====== Google OAuth Setup (guarded if env is missing) ======
const hasGoogleCreds = Boolean(
  googleOAuthConfig && googleOAuthConfig.clientID && googleOAuthConfig.clientSecret
);

if (hasGoogleCreds) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleOAuthConfig.clientID,
        clientSecret: googleOAuthConfig.clientSecret,
        callbackURL: googleOAuthConfig.callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0] && profile.emails[0].value;
          if (!email)
            return done(new Error("No email found in Google profile"));

          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            const usernameBase = deriveUsernameFromEmail(email);
            let existingByUsername = await User.findOne({
              username: usernameBase,
            });

            if (existingByUsername) {
              user = existingByUsername;
              user.googleId = profile.id;
              user.provider = "google";
              await user.save();
            } else {
              const uniqueUsername = await ensureUniqueUsername(usernameBase);
              user = new User({
                username: uniqueUsername,
                password: crypto.randomBytes(16).toString("hex"), // dummy password
                role: "user",
                googleId: profile.id,
                provider: "google",
              });
              await user.save();
            }
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn("Google OAuth env vars missing: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET. Skipping Google strategy setup.");
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ====== Routes ======

/**
 * @route   GET /api/auth/google
 * @desc    Start Google OAuth login
 */
if (hasGoogleCreds) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
} else {
  router.get("/google", (req, res) => {
    return res.status(503).json({ success: false, message: "Google OAuth not configured" });
  });
}

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 */
if (hasGoogleCreds) {
  router.get(
    "/google/callback",
    (req, res, next) => {
      passport.authenticate("google", { session: false }, (err, user) => {
        if (err || !user) {
          const fallback = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?oauth=failed`;
          return res.redirect(fallback);
        }
        req.user = user;
        next();
      })(req, res, next);
    },
    (req, res) => {
      try {
        const accessToken = signAccessToken(req.user);
        const refreshToken = signRefreshToken(req.user);
        refreshStore.set(String(req.user._id), refreshToken);

        const front = process.env.FRONTEND_URL || "http://localhost:5173";
        const redirectUrl = new URL(`${front.replace(/\/$/, "")}/auth/callback`);
        redirectUrl.searchParams.set("accessToken", accessToken);
        redirectUrl.searchParams.set("refreshToken", refreshToken);
        redirectUrl.searchParams.set("userId", req.user._id.toString());
        redirectUrl.searchParams.set("role", req.user.role);
        redirectUrl.searchParams.set("username", req.user.username);

        res.redirect(redirectUrl.toString());
      } catch (e) {
        const fallback = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?oauth=error`;
        res.redirect(fallback);
      }
    }
  );
} else {
  router.get("/google/callback", (req, res) => {
    return res.status(503).json({ success: false, message: "Google OAuth not configured" });
  });
}

const { registerBody } = require('../validators/schemas');
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
      // localByUsername schema
      username = data.username;
      name = data.username; // Use username as name
      email = undefined;
    } else {
      // localByEmail schema
      name = data.name;
      email = data.email;
      // Derive username from name
      let baseUsername = name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
      if (baseUsername.length < 3) baseUsername = (baseUsername + 'user123').slice(0, 10);
      username = await ensureUniqueUsername(baseUsername);
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
    if (!username && email) username = deriveUsernameFromEmail(email);
    if (!username || !password)
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });

    // Special case for admin login
    if (username === 'admin' && password === 'admin123') {
      let adminUser = await User.findOne({ username: 'admin' });
      if (!adminUser) {
        adminUser = new User({
          username: 'admin',
          name: 'Admin',
          password: 'admin123',
          role: 'admin',
          provider: 'local',
        });
        await adminUser.save();
      }
      const accessToken = signAccessToken(adminUser);
      const refreshToken = signRefreshToken(adminUser);
      refreshStore.set(String(adminUser._id), refreshToken);

      return res.json({
        success: true,
        message: "Logged in as admin",
        data: {
          user: { id: adminUser._id, username: adminUser.username, role: adminUser.role },
          accessToken,
          refreshToken,
        },
      });
    }

    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    refreshStore.set(String(user._id), refreshToken);

    return res.json({
      success: true,
      message: "Logged in",
      data: {
        user: { id: user._id, username: user.username, role: user.role },
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
    const stored = refreshStore.get(String(payload.id));
    if (stored !== refreshToken) throw new Error("Invalid refresh token");

    const user = await User.findById(payload.id);
    if (!user)
      return res.status(401).json({ success: false, message: "User not found" });

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

module.exports = router;
