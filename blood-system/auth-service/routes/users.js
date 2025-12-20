const express = require('express');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /users/me
 * Get current user details
 */
router.get('/users/me', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.user?.user_id; // Support both Gateway header and potential local auth
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User context missing' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                ...user.toJSON(),
                username: user.name // Compatibility
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /users
 * List users with filters
 * Query: role, username, date (createdAt)
 */
router.get('/users', async (req, res) => {
    try {
        const { role, username, date } = req.query;
        const query = {};

        if (role) {
            query.role = { $regex: role, $options: 'i' };
        }
        if (username) {
            query.username = { $regex: username, $options: 'i' }; // Assuming 'name' in model, but dashboard searches 'username'. Let's map to 'name' or 'email' or add 'username' alias if needed. Model has 'name' and 'email'. Dashboard displays 'username' from user.username.
            // Wait, User model has 'name' and 'email'. It does NOT have 'username'.
            // Dashboard expects 'username' in response. I should map 'name' to 'username' in response or update query to search 'name'.
            // Let's search 'name' and 'email'.
            delete query.username;
            query.$or = [
                { name: { $regex: username, $options: 'i' } },
                { email: { $regex: username, $options: 'i' } }
            ];
        }
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        const users = await User.find(query).select('-password');

        // Transform for dashboard (map name -> username if needed, or dashboard just displays what it gets)
        // Dashboard uses `user.username`. I should ensure I return `username` property or dashboard will show blank.
        // User model has `name`. I will add a virtual or map it.
        const transformedUsers = users.map(u => ({
            ...u.toJSON(),
            username: u.name // Map name to username for dashboard compatibility
        }));

        res.json({
            success: true,
            data: transformedUsers
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /admins
 * List all admins
 */
router.get('/admins', async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        const transformedAdmins = admins.map(u => ({
            ...u.toJSON(),
            username: u.name
        }));
        res.json({
            success: true,
            data: transformedAdmins
        });
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /bloodbanks
 * List all bloodbanks (users with role BLOODBANK_ADMIN)
 */
router.get('/bloodbanks', async (req, res) => {
    try {
        const bloodbanks = await User.find({ role: 'BLOODBANK_ADMIN' }).select('-password');
        // Bloodbank in dashboard expects: name, address (string or obj), status (derived from isBlocked/Suspended?), contactNumber?
        // User model: name, email, hospital_id.
        // Address/Contact/Status usually in separate Profile or just mocked?
        // Dashboard uses `bb.status` for pending/approve logic. This implies a `status` field.
        // And `address`, `district`, `contactNumber`, `licenseNumber`.
        // These fields are NOT in the User model. They likely belong to a `BloodBank` profile model or the User model needs more fields.
        // For now, I'll return what I have and maybe some defaults to avoid crashes.
        // Dashboard logic: `bb.status === "pending"` shows Approve/Reject buttons.
        // If I return simple Users, they won't have 'pending' status likely.
        // I'll populate default status as 'active' or 'pending' if not present.
        const transformed = bloodbanks.map(u => ({
            ...u.toJSON(),
            username: u.name,
            status: u.isActive ? 'active' : 'inactive', // distinct from 'pending' approval
            address: 'N/A', // Missing in User model
            district: 'N/A',
            contactNumber: 'N/A',
            licenseNumber: 'N/A'
        }));
        res.json({
            success: true,
            data: transformed
        });
    } catch (error) {
        console.error('Get bloodbanks error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PUT /:id/status
 * Update user status (block/suspend)
 */
router.put('/:id/status', async (req, res) => {
    try {
        const { isBlocked, isSuspended, warningMessage } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBlocked, isSuspended, warningMessage },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, message: 'Status updated', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
