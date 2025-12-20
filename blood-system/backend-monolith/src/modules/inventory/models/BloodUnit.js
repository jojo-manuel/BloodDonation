const mongoose = require('mongoose');

const bloodUnitSchema = new mongoose.Schema({
    blood_group: {
        type: String,
        required: [true, 'Blood group is required'],
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    unit_type: {
        type: String,
        enum: ['Whole Blood', 'Plasma', 'Platelets', 'Red Blood Cells'],
        default: 'Whole Blood'
    },
    collection_date: { type: Date, default: Date.now },
    expiry_date: { type: Date, required: [true, 'Expiry date is required'] },
    status: {
        type: String,
        enum: ['available', 'reserved', 'expired', 'used'],
        default: 'available'
    },
    donor_id: { type: String, trim: true },
    hospital_id: { type: String, required: true, trim: true },
    storage_location: { type: String, trim: true },
    batch_number: { type: String, trim: true },
    notes: { type: String }
}, {
    timestamps: true
});

bloodUnitSchema.index({ hospital_id: 1, blood_group: 1, status: 1 });
bloodUnitSchema.index({ expiry_date: 1 });
bloodUnitSchema.index({ hospital_id: 1, status: 1 });

bloodUnitSchema.methods.isExpired = function () {
    return new Date() > this.expiry_date;
};

bloodUnitSchema.methods.isExpiringSoon = function () {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return this.expiry_date <= sevenDaysFromNow && this.expiry_date > new Date();
};

bloodUnitSchema.pre('save', function (next) {
    if (this.isExpired() && this.status === 'available') {
        this.status = 'expired';
    }
    next();
});

bloodUnitSchema.statics.getAvailability = async function (hospital_id, blood_group = null) {
    const match = {
        hospital_id,
        status: 'available',
        expiry_date: { $gt: new Date() }
    };
    if (blood_group) match.blood_group = blood_group;

    const availability = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$blood_group',
                total_quantity: { $sum: '$quantity' },
                units_count: { $sum: 1 },
                earliest_expiry: { $min: '$expiry_date' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    return availability;
};

module.exports = mongoose.model('BloodUnit', bloodUnitSchema);
