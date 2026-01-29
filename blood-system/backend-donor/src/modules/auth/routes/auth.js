const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../users/models/UserModel');

// JWT secrets (use environment variables in production)
const ACCESS_SECRET = process.env.JWT_SECRET || 'bloodbank_access_secret_2024';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'bloodbank_refresh_secret_2024';

// Helper functions
function signAccessToken(user) {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
            username: user.username || user.email,
            hospital_id: user.hospital_id
        },
        ACCESS_SECRET,
        { expiresIn: '15m' }
    );
}

function signRefreshToken(user) {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * POST /login
 * Login with username/email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Validate input
        if (!password || (!email && !username)) {
            return res.status(400).json({
                success: false,
                message: 'Email/username and password are required'
            });
        }

        // Find user by email or username
        const identifier = email || username;
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive || user.isBlocked || user.isSuspended) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive or blocked'
            });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    hospital_id: user.hospital_id
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

/**
 * POST /refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        jwt.verify(refreshToken, REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }

            // Find user
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate new tokens
            const newAccessToken = signAccessToken(user);
            const newRefreshToken = signRefreshToken(user);

            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            });
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during token refresh'
        });
    }
});

/**
 * POST /logout
 * Logout user (client-side token removal)
 */
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * GET /me
 * Get current user info
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);

        jwt.verify(token, ACCESS_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid token'
                });
            }

            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    hospital_id: user.hospital_id
                }
            });
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
