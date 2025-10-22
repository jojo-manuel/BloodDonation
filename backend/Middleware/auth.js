// Middleware/auth.js
// JWT authentication middleware. Attaches decoded payload to req.user.

const jwt = require('jsonwebtoken');
const User = require('../Models/User');

/**
 * Auth middleware factory
 * @param {boolean} required - when true, reject if no/invalid token; when false, pass through
 */
module.exports = function auth(required = true) {
  const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return required
        ? res.status(401).json({ success: false, message: 'Unauthorized' })
        : next();
    }

    try {
      // Verify token
      const payload = jwt.verify(token, ACCESS_SECRET);

      // Find user to check status
      const user = await User.findById(payload.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      // Check if user is soft deleted
      if (user.isDeleted) {
        return res.status(403).json({ success: false, message: "Your account has been deleted." });
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

      // Attach user to request
      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
};



