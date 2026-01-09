const express = require('express');
const router = express.Router();
const verifyToken = require('../../../middleware/auth');
const User = require('../../../modules/auth/models/User');

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update current user profile
router.put('/me', verifyToken, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findById(req.user.user_id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name;

        await user.save();

        res.json({ success: true, message: 'Profile updated', data: user });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get comprehensive user profile (User + Role Specific Data)
router.get('/me/comprehensive', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let roleData = null;

        // Try to fetch Donor profile if user is a donor
        // We use try-catch for require to avoid crashing services that don't have the Donor module (like backend-login)
        if (user.role === 'donor') {
            try {
                // Adjust path based on where this file is relative to donor module in the container
                // src/modules/users/routes/users.js -> ../../../modules/donor/models/Donor.js
                // In container: /app/src/modules/users/routes/users.js
                // Target: /app/src/modules/donor/models/Donor.js
                // Path: ../../donor/models/Donor.js
                const Donor = require('../../donor/models/Donor');
                const donorProfile = await Donor.findOne({ userId: user._id });
                if (donorProfile) {
                    roleData = donorProfile;
                }
            } catch (err) {
                // Donor module likely not present in this service
                // console.warn('Donor module not found in this service, skipping donor profile fetch');
            }
        }

        // We can add similar blocks for BloodBank or Admin if needed and if their modules are standard

        res.json({
            success: true,
            data: {
                user: user,
                [user.role]: roleData // e.g. { user: ..., donor: ... }
            }
        });

    } catch (error) {
        console.error('Error fetching comprehensive profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
