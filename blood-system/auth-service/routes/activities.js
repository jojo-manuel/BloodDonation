const express = require('express');
const router = express.Router();

/**
 * GET /activities
 * List system activities (Placeholder)
 */
router.get('/activities', (req, res) => {
    // Return empty list or mock data for now
    res.json({
        success: true,
        data: [
            { id: 1, action: "System Started", user: "System", time: new Date() }
        ]
    });
});

module.exports = router;
