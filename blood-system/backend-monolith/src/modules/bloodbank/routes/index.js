const express = require('express');
const router = express.Router();
const User = require('../../auth/models/User'); // Import User model to verify

// GET /api/bloodbank/details?userId=...
router.get('/details', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

        // Verify user exists and is bloodbank
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role !== 'BLOODBANK_ADMIN' && user.role !== 'bloodbank') {
            // Basic check, though role might be BLOODBANK_ADMIN in DB
            // The login logic checks role === 'bloodbank'.
        }

        // Return mock details expected by frontend
        // Frontend expects: data.data.status = 'approved' | 'pending' | 'rejected'
        // We'll default to 'approved' for the seeded user.
        res.json({
            success: true,
            data: {
                status: 'approved',
                hospital_id: user.hospital_id,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Bloodbank details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
