const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
    sensor_id: {
        type: String,
        required: [true, 'Sensor ID is required'],
        trim: true
    },
    sensor_type: {
        type: String,
        required: [true, 'Sensor type is required'],
        enum: ['temperature', 'centrifuge', 'humidity', 'pressure']
    },
    value: {
        type: Number,
        required: [true, 'Sensor value is required']
    },
    unit: {
        type: String,
        required: [true, 'Unit is required']
    },
    hospital_id: {
        type: String,
        required: [true, 'Hospital ID is required'],
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['normal', 'warning', 'critical'],
        default: 'normal'
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Indexes
sensorDataSchema.index({ hospital_id: 1, sensor_type: 1, createdAt: -1 });
sensorDataSchema.index({ sensor_id: 1, createdAt: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
