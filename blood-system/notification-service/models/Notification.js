const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: String, // userId or 'admin' or 'all'
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error', 'request', 'donation'],
        default: 'info'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: Object, // Optional payload (e.g., requestId, donorId)
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
