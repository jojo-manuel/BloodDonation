const mongoose = require('mongoose');

const donationRequestSchema = new mongoose.Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'rescheduled', 'booked', 'arrived'],
        default: 'pending'
    },
    scheduledDate: { type: Date },
    scheduledTime: { type: String },
    tokenNumber: { type: String },
    weight: { type: Number }, // Donor's weight in kg
    bagSerialNumber: { type: String }, // Blood bag serial number
    rejectionReason: { type: String }
}, {
    timestamps: true,
    collection: 'donationrequests' // Explicitly mapping to existing collection
});

module.exports = mongoose.model('DonationRequest', donationRequestSchema);
