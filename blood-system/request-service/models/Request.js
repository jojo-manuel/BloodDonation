const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    requester_id: {
        type: String,
        required: [true, 'Requester ID is required'],
        trim: true
    },
    requester_name: {
        type: String,
        trim: true
    },
    blood_group: {
        type: String,
        required: [true, 'Blood group is required'],
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'],
        default: 'pending'
    },
    hospital_id: {
        type: String,
        required: [true, 'Hospital ID is required'],
        trim: true
    },
    patient_name: {
        type: String,
        trim: true
    },
    patient_age: {
        type: Number
    },
    reason: {
        type: String,
        trim: true
    },
    notes: {
        type: String
    },
    approved_by: {
        type: String
    },
    approved_at: {
        type: Date
    },
    rejected_reason: {
        type: String
    },
    fulfilled_at: {
        type: Date
    },
    reserved_units: [{
        unit_id: String,
        quantity: Number
    }]
}, {
    timestamps: true
});

// Indexes for efficient queries
requestSchema.index({ hospital_id: 1, status: 1 });
requestSchema.index({ requester_id: 1 });
requestSchema.index({ urgency: 1, createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
