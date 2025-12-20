const express = require('express');
const SensorData = require('../models/SensorData');

const router = express.Router();

// ==========================================
// ROUTES
// ==========================================

/**
 * POST /sensors/data
 * Receive sensor data from IoT devices
 * Access: BLOODBANK_ADMIN
 */
router.post('/data', async (req, res) => {
    try {
        const { sensor_id, sensor_type, value, unit, location, metadata } = req.body;
        const hospital_id = req.headers['x-hospital-id'] || req.body.hospital_id;

        if (!sensor_id || !sensor_type || value === undefined || !unit) {
            return res.status(400).json({
                success: false,
                message: 'sensor_id, sensor_type, value, and unit are required'
            });
        }

        // Determine status based on sensor type and value
        let status = 'normal';

        if (sensor_type === 'temperature') {
            if (value < 2 || value > 6) {
                status = 'critical'; // Blood storage temperature should be 2-6°C
            } else if (value < 3 || value > 5) {
                status = 'warning';
            }
        }

        if (sensor_type === 'centrifuge') {
            if (value < 1000 || value > 5000) {
                status = 'warning'; // RPM out of normal range
            }
        }

        const sensorData = new SensorData({
            sensor_id,
            sensor_type,
            value,
            unit,
            hospital_id,
            location,
            status,
            metadata
        });

        await sensorData.save();

        res.status(201).json({
            success: true,
            message: 'Sensor data recorded successfully',
            data: sensorData
        });

    } catch (error) {
        console.error('Record sensor data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record sensor data',
            error: error.message
        });
    }
});

/**
 * GET /sensors/data
 * Get sensor data history
 * Access: BLOODBANK_ADMIN
 */
router.get('/data', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'] || req.query.hospital_id;
        const { sensor_id, sensor_type, status, page = 1, limit = 50 } = req.query;

        const query = { hospital_id };

        if (sensor_id) {
            query.sensor_id = sensor_id;
        }

        if (sensor_type) {
            query.sensor_type = sensor_type;
        }

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const sensorData = await SensorData.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await SensorData.countDocuments(query);

        res.json({
            success: true,
            data: {
                sensor_data: sensorData,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get sensor data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sensor data',
            error: error.message
        });
    }
});

/**
 * GET /sensors/alerts
 * Get critical sensor alerts
 * Access: BLOODBANK_ADMIN
 */
router.get('/alerts', async (req, res) => {
    try {
        const hospital_id = req.headers['x-hospital-id'] || req.query.hospital_id;

        const alerts = await SensorData.find({
            hospital_id,
            status: { $in: ['warning', 'critical'] }
        })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            data: {
                alerts,
                count: alerts.length
            }
        });

    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts',
            error: error.message
        });
    }
});

module.exports = router;
