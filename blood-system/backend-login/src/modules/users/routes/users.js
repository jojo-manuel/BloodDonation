const express = require('express');
const router = express.Router();

try {
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

} catch (err) {
    console.error('Error loading dependencies in users.js:', err);
}

module.exports = router;
