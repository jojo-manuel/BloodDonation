const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');

// Configure multer to handle file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Handle AI Blood Sample infection analysis
 * POST /api/analysis/blood-sample
 */
router.post('/blood-sample', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        // Ensure user is authorized (Doctor or staff)
        const allowedRoles = ['doctor', 'bleeding_staff', 'bloodbank', 'store_manager', 'lab', 'centrifuge_staff'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only medical staff can perform analysis.'
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Blood sample image is required' });
        }

        const { hbCount } = req.body;
        if (!hbCount) {
            return res.status(400).json({ success: false, message: 'Hemoglobin (Hb) count is required' });
        }

        // Prepare the payload to send to the Python microservice
        const form = new FormData();
        form.append('image', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        form.append('hb_count', (hbCount).toString());

        // Call the Python AI Microservice (running on localhost:8000)
        // Hardcoded for now. In production, this would be an ENV variable mapped to a docker container
        const pythonApiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/predict-infection';

        const aiResponse = await axios.post(pythonApiUrl, form, {
            headers: {
                ...form.getHeaders()
            },
            // Set a timeout in case the pytorch model takes too long
            timeout: 10000
        });

        // Return the AI Results back to the frontend
        res.status(200).json({
            success: true,
            message: "Analysis completed successfully",
            data: aiResponse.data
        });

    } catch (error) {
        console.error('Error in AI Analysis Route:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'AI Analysis Service is currently unreachable.'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to complete blood sample analysis',
            error: error.response?.data || error.message
        });
    }
});

module.exports = router;
