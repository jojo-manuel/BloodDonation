// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../Models/User");

/**
 * Middleware to verify JWT and attach user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
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

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
