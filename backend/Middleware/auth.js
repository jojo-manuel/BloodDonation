// Middleware/auth.js
// JWT authentication middleware. Attaches decoded payload to req.user.

const jwt = require('jsonwebtoken');

/**
 * Auth middleware factory
 * @param {boolean} required - when true, reject if no/invalid token; when false, pass through
 */
module.exports = function auth(required = true) {
  const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return required
        ? res.status(401).json({ success: false, message: 'Unauthorized' })
        : next();
    }

    try {
      // Verify and attach user payload
      const payload = jwt.verify(token, ACCESS_SECRET);
      req.user = payload;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
};



