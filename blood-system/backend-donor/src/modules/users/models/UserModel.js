const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 50,
        sparse: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    role: {
        type: String,
        required: true,
        enum: ['DONOR', 'DOCTOR', 'BLOODBANK_ADMIN', 'admin', 'bloodbank', 'user', 'store_manager', 'frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'centrifuge_staff']
    },
    hospital_id: {
        type: String
    },
    phone: {
        type: String,
        trim: true
    },
    profileImage: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Hash password method
userSchema.methods.hashPassword = async function (password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
