const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    bloodBankId: {
        type: String, // Storing hospital_id (e.g. 'navjeevan-blood-bank') or ObjectId? 
        // Frontend uses `bloodBankDetails._id`. 
        // `bloodBankDetails` usually comes from `/details` which returns User object or similar.
        // Let's assume it matches `hospital_id` or User `_id`.
        // In `bloodbank/routes/index.js`, `/details` returns `hospital_id`.
        // But `BloodBankDashboard` passes `bloodBankDetails._id`.
        // Use ObjectId for referencing the Blood Bank USER.
        required: true,
        ref: 'User'
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
