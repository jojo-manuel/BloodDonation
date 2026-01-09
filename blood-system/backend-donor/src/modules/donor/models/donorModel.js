const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming there is a User model, though in microservices this might just be an ID
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other']
    },
    bloodGroup: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true
    },
    emergencyContactNumber: {
        type: String,
        required: true,
        trim: true
    },
    houseAddress: {
        houseName: String,
        houseAddress: String,
        localBody: String,
        city: String,
        district: String,
        state: String,
        pincode: String
    },
    workAddress: {
        type: String,
        trim: true
    },
    weight: {
        type: Number,
        required: true
    },
    availability: {
        type: Boolean,
        default: true
    },
    lastDonatedDate: {
        type: Date
    },
    contactPreference: {
        type: String,
        enum: ['phone', 'email'],
        default: 'phone'
    },
    eligibilityStatus: {
        type: String,
        enum: ['eligible', 'ineligible', 'temp_ineligible'],
        default: 'eligible'
    }
}, {
    timestamps: true
});

// Index for geospatial search if needed later, or simple search
donorSchema.index({ bloodGroup: 1 });
donorSchema.index({ 'houseAddress.city': 1 });
donorSchema.index({ 'houseAddress.district': 1 });
donorSchema.index({ 'houseAddress.pincode': 1 });

module.exports = mongoose.model('Donor', donorSchema);
