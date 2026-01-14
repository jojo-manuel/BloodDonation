const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true,
        default: () => 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    },
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    donorName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "10:00 AM"
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'rejected', 'cancelled', 'arrived'],
        default: 'pending'
    },
    hospital_id: { type: String, required: true, index: true },
    tokenNumber: { type: String }, // For queue management
    patientName: { type: String }, // If directed donation
    patientMrid: { type: String },
    requesterName: { type: String },
    rejectionReason: { type: String },
    weight: { type: Number }, // Donor's weight in kg
    bagSerialNumber: { type: String }, // Blood bag serial number
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
