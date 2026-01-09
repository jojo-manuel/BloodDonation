const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true }, // We won't touch this here usually
    name: { type: String, required: true },
    role: { type: String, required: true },
    hospital_id: { type: String },
    profileImage: { type: String }, // URL or path to image
    phone: { type: String }, // Adding phone as it might be useful
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
