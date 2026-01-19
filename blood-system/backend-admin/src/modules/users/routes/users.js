const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

console.log('Loading users.js router...');

let User;
let verifyToken;

try {
    verifyToken = require('../../../middleware/auth');
    User = require('../../../modules/auth/models/User');
    console.log('Users dependencies loaded');
} catch (err) {
    console.error('CRITICAL: Failed to load User or Auth middleware in users.js:', err);
}

if (User && verifyToken) {
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
            if (user.role === 'donor') {
                try {
                    // Start relative path from this file: src/modules/users/routes/users.js
                    // Target: src/modules/donor/models/Donor.js
                    // Path: ../../donor/models/Donor.js
                    const donorPath = path.resolve(__dirname, '../../donor/models/Donor.js');
                    if (fs.existsSync(donorPath)) {
                        const Donor = require(donorPath);
                        const donorProfile = await Donor.findOne({ userId: user._id });
                        if (donorProfile) roleData = donorProfile;
                    }
                } catch (err) {
                    console.log('Donor module not loaded or found:', err.message);
                }
            }
            res.json({
                success: true,
                data: {
                    user: user,
                    [user.role]: roleData
                }
            });

        } catch (error) {
            console.error('Error fetching comprehensive profile:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // POST /direct-book-slot - NOT IMPLEMENTED
    router.post('/direct-book-slot', verifyToken, (req, res) => {
        res.status(501).json({ success: false, message: 'Not implemented in Admin Backend' });
    });
} else {
    // Fallback routes if dependencies failed
    router.use((req, res) => {
        res.status(500).json({ success: false, message: 'Users module failed to initialize dependencies' });
    });
}

module.exports = router;
