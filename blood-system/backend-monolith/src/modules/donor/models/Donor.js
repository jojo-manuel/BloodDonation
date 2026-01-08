const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    blood_group: { type: String, required: true, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    contact: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    age: { type: Number, required: true, min: 18, max: 65 },
    dob: { type: Date },
    weight: { type: Number, min: 50 },
    last_donation_date: { type: Date },
    eligibility_status: { type: Boolean, default: true },
    eligibility_notes: { type: String },
    medical_conditions: { type: [String], default: [] },
    hospital_id: { type: String, default: 'generic' },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
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
    workAddress: String,
    availability: { type: Boolean, default: true },
    contactPreference: { type: String, enum: ['phone', 'email'], default: 'phone' },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

donorSchema.methods.checkEligibility = function () {
    const today = new Date();
    // Age check
    if (this.age < 18 || this.age > 65) {
        this.eligibility_status = false;
        this.eligibility_notes = 'Age must be between 18 and 65';
        return { eligible: false, reason: this.eligibility_notes };
    }
    // Weight check
    if (this.weight < 50) {
        this.eligibility_status = false;
        this.eligibility_notes = 'Weight must be at least 50kg';
        return { eligible: false, reason: this.eligibility_notes };
    }
    // Last donation check
    if (this.last_donation_date) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (this.last_donation_date > threeMonthsAgo) {
            this.eligibility_status = false;
            this.eligibility_notes = 'Must wait 3 months between donations';
            return { eligible: false, reason: this.eligibility_notes };
        }
    }

    this.eligibility_status = true;
    this.eligibility_notes = 'Eligible to donate';
    return { eligible: true, reason: this.eligibility_notes };
};

module.exports = mongoose.model('Donor', donorSchema);
