const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7);

    jwt.verify(token, ACCESS_SECRET, async (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err.message);
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
          error: err.message
        });
      }

      // Find user in database
      const userId = decoded.user_id || decoded.id || decoded._id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (!user.isActive || user.isBlocked || user.isSuspended) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive or blocked'
        });
      }

      // Add user info to request
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        hospital_id: user.hospital_id
      };

      next();
    });

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Blood bank manager authorization middleware
 */
const requireBloodBankManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  console.log('User accessing blood bank manager route:', JSON.stringify(req.user, null, 2));

  const allowedRoles = ['bloodbank', 'bloodbank_admin', 'store_manager', 'admin'];
  if (!req.user.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
    console.log('Access denied for user role:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Blood bank manager role required.'
    });
  }

  // Add blood bank info to request
  req.bloodBank = {
    _id: req.user.hospital_id,
    name: 'Blood Bank'
  };

  next();
};

/**
 * Store manager authorization middleware
 */
const requireStoreManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!['store_manager', 'bloodbank', 'BLOODBANK_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Store manager role required.'
    });
  }

  // Add blood bank info to request
  req.bloodBank = {
    _id: req.user.hospital_id,
    name: 'Blood Bank'
  };

  next();
};

module.exports = {
  authMiddleware,
  requireRole,
  requireBloodBankManager,
  requireStoreManager
};