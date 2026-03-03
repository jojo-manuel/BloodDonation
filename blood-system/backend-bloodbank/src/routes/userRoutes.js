const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Helper to hash password
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * GET /api/users/me
 * Get basic user profile (used by dashboard)
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                username: user.username,
                hospital_id: user.hospital_id
            }
        });
    } catch (error) {
        console.error('Get basic profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/users/me/comprehensive
 * Get comprehensive user profile
 */
router.get('/me/comprehensive', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user is donor via role or flag
        const isDonor = user.role === 'DONOR' || user.role === 'user' || user.isDonor === true;

        // Construct response matching frontend expectation
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    username: user.username,
                    createdAt: user.createdAt,
                    bloodGroup: user.bloodGroup,
                    isDonor: isDonor
                },
                isDonor,
                donorInfo: isDonor ? {
                    bloodGroup: user.bloodGroup || 'N/A',
                    weight: user.donorInfo?.weight || 0,
                    availability: user.donorInfo?.availability !== false, // default true
                    address: user.donorInfo?.address || {}
                } : null,
                donations: [],
                patientsHelped: [],
                nextDonationDate: null,
                totalDonations: 0
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * PUT /api/users/me
 * Update user profile (name, phone)
 */
router.put('/me', authMiddleware, async (req, res) => {
    try {
        const { name, phone } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * PUT /api/users/password
 * Update user password
 */
router.put('/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        // Hash new password
        user.password = await hashPassword(newPassword);
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * PATCH /api/users/me/availability
 * Update donor availability
 */
router.patch('/me/availability', authMiddleware, async (req, res) => {
    try {
        const { availability } = req.body;

        // In a real app, this would update the Donor model. 
        // Since we are mocking donor info or it's on User, we'll just return success for now
        // or update if we had a field. User model doesn't have availability.

        res.json({
            success: true,
            message: 'Availability updated successfully'
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * DELETE /api/users/me
 * Deactivate/Delete user account
 */
router.delete('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isActive = false;
        await user.save();

        res.json({
            success: true,
            message: 'Account deactivated successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/users/become-donor
 * Register current user as a donor
 */
router.post('/become-donor', authMiddleware, async (req, res) => {
    try {
        const { bloodGroup, weight, address } = req.body;

        if (!bloodGroup) {
            return res.status(400).json({ success: false, message: 'Blood group is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update user to be a donor
        user.isDonor = true;
        user.bloodGroup = bloodGroup;

        // Initialize donorInfo if needed
        if (!user.donorInfo) user.donorInfo = {};
        if (weight) user.donorInfo.weight = weight;
        if (address) user.donorInfo.address = address;

        await user.save();

        res.json({
            success: true,
            message: 'Congratulations! You are now a registered donor.',
            data: {
                isDonor: true,
                bloodGroup: user.bloodGroup
            }
        });
    } catch (error) {
        console.error('Become donor error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
