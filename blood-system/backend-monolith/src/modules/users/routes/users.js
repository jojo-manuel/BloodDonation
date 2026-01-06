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
        // if (phone) user.phone = phone; // User model doesn't strictly have phone in the schema shown earlier? 
        // Let's check User schema again. Step 154: name, email, password, role, hospital_id. NO PHONE.
        // But UserDashboard sends phone. 
        // We will ignore phone for now or add it to schema if needed. 
        // Wait, line 21 in user schema: name. 

        await user.save();

        res.json({ success: true, message: 'Profile updated', data: user });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
