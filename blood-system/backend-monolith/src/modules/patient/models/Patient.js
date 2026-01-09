const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        houseName: String,
        houseAddress: String,
        pincode: String,
        district: String,
        city: String,
        localBody: String,
        state: String
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: true
    },
    mrid: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    requiredUnits: {
        type: Number,
        default: 0
    },
    requiredDate: {
        type: Date
    },
    hospital_id: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Patient', patientSchema);
