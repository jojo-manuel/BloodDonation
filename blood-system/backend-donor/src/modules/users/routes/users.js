const express = require('express');
const router = express.Router();

// Placeholder routes
// Mock user for DonorRegister 'me' call
router.get('/me', (req, res) => res.json({ success: true, data: { name: "Test User", phone: "9999999999", email: "test@example.com", role: "donor" } }));

// Mock comprehensive user data
router.get('/me/comprehensive', (req, res) => res.json({
    success: true,
    data: {
        name: "Test User",
        phone: "9999999999",
        email: "test@example.com",
        role: "donor",
        address: {
            street: "123 Test St",
            city: "Test City"
        }
    }
}));

module.exports = router;
