const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
    bloodBankId: { type: mongoose.Schema.Types.Mixed }, // Accepts both ObjectId and String
    donationRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'DonationRequest' },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM
    status: { type: String, default: 'scheduled', enum: ['scheduled', 'completed', 'cancelled', 'noshow'] },
    tokenNumber: { type: String, required: true },
    meta: {
        patientName: String,
        donorName: String,
        requesterName: String
    },
    medicalConsent: { type: Object },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
