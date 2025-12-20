const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ==========================================
// VALIDATION RULES
// ==========================================

const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(['DONOR', 'DOCTOR', 'BLOODBANK_ADMIN', 'admin']).withMessage('Invalid role'),
    body('hospital_id').trim().notEmpty().withMessage('Hospital ID is required')
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const generateToken = (user) => {
    const payload = {
        user_id: user._id,
        email: user.email,
        role: user.role,
        hospital_id: user.hospital_id
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

// ==========================================
// ROUTES
// ==========================================

/**
 * POST /register
 * Register a new user
 */
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password, name, role, hospital_id } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            name,
            role,
            hospital_id
        });

        await user.save();

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

/**
 * POST /login
 * Authenticate user and return JWT token
 */
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

/**
 * POST /refresh
 * Refresh JWT token (Not fully implemented stateless, just re-issues for valid user)
 * In a real implementation, valid Refresh Token would be required.
 * For now, we assume if you can call this (and pass Gateway), you are effectively refreshing.
 * BUT wait, gateway removes /api/auth prefix but does NOT verify token for /auth routes.
 * So we MUST verify the REFRESH TOKEN from body here.
 */
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh Token Required' });
    }
    // Simplified: In this specific codebase, we likely don't have separate refresh tokens stored in DB individually
    // or logic to verify them deeply.
    // If we assume standard JWT flow, we verify it.
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user_id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newToken = generateToken(user);
        // Ensure we transmit the SAME refresh token back or a new one. 
        // If we don't have rotation, just return the same one or a new signed one.
        // Let's just return the new access token.

        res.json({
            success: true,
            data: {
                accessToken: newToken,
                refreshToken: refreshToken // Echo back or rotate
            }
        });
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid Refresh Token' });
    }
});

/**
 * GET /verify
 * Verify JWT token (for testing)
 */
router.get('/verify', (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        res.json({
            success: true,
            message: 'Token is valid',
            data: decoded
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: error.message
        });
    }
});

module.exports = router;
