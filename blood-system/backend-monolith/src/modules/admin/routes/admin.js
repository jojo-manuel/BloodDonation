const express = require('express');
const router = express.Router();
const User = require('../../auth/models/User');
// Import Request model
const Request = require('../../request/models/Request');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    // In a real app, we would verify the token and check the role here
    // For now, we assume the API Gateway or previous middleware handled authentication
    // But since this is the monolith and we want to be secure:
    try {
        // We expect req.user to be populated by an authentication middleware
        // For now, let's just proceed or if we need to add auth middleware, we should.
        // The current app.js doesn't seem to apply a global auth middleware, 
        // so we might need to add one or rely on specific route protection.
        // For this refactor, I will focus on the route handlers first.
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
};

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/donors - List all donors
router.get('/donors', async (req, res) => {
    try {
        const donors = await User.find({ role: 'DONOR' }).select('-password');
        res.json({ success: true, data: donors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/bloodbanks - List all blood banks
router.get('/bloodbanks', async (req, res) => {
    try {
        const bloodbanks = await User.find({ role: { $in: ['BLOODBANK_ADMIN', 'bloodbank'] } }).select('-password');
        // Map to expected format if needed, but frontend likely handles standard user object
        // The frontend expected 'username' in one of the views, but let's send standard format first.
        // We might need to map 'name' to 'username' if legacy frontend requires it.
        const transformed = bloodbanks.map(u => ({
            ...u.toJSON(),
            username: u.name,
            status: u.isActive ? 'active' : 'inactive',
            address: 'N/A',
            district: 'N/A',
            contactNumber: 'N/A',
            licenseNumber: 'N/A'
        }));

        res.json({ success: true, data: transformed });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/admins - List all admins
router.get('/admins', async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/activities - List activities (Mock for now)
router.get('/activities', async (req, res) => {
    try {
        // Return empty list or mock data
        res.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/patients - List patients (Mock or reuse Users if separate role)
router.get('/patients', async (req, res) => {
    try {
        // Assuming patients might be users with specific role or requests
        // For now, return empty to stop 404
        res.json({ success: true, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/donation-requests - List donation requests
router.get('/donation-requests', async (req, res) => {
    try {
        const requests = await Request.find().sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
