const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    blood_group: { type: String, required: true, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    contact: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    age: { type: Number, required: true, min: 18, max: 65 },
    weight: { type: Number, min: 50 },
    last_donation_date: { type: Date },
    eligibility_status: { type: Boolean, default: true },
    eligibility_notes: { type: String },
    medical_conditions: { type: [String], default: [] },
    hospital_id: { type: String, required: true, trim: true },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

donorSchema.index({ hospital_id: 1, blood_group: 1 });
donorSchema.index({ hospital_id: 1, eligibility_status: 1 });

donorSchema.methods.checkEligibility = function () {
    const reasons = [];
    if (this.age < 18 || this.age > 65) reasons.push('Age must be between 18 and 65');
    if (this.weight && this.weight < 50) reasons.push('Weight must be at least 50 kg');
    if (this.last_donation_date) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (this.last_donation_date > threeMonthsAgo) reasons.push('Must wait 3 months since last donation');
    }

    const disqualifyingConditions = ['HIV', 'Hepatitis', 'Cancer', 'Heart Disease'];
    const hasDisqualifyingCondition = this.medical_conditions.some(condition =>
        disqualifyingConditions.some(dc => condition.toLowerCase().includes(dc.toLowerCase()))
    );
    if (hasDisqualifyingCondition) reasons.push('Medical condition prevents donation');

    this.eligibility_status = reasons.length === 0;
    this.eligibility_notes = reasons.join('; ');
    return { eligible: this.eligibility_status, reasons: reasons };
};

module.exports = mongoose.model('Donor', donorSchema);
