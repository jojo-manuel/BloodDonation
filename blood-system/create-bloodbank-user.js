const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    hospital_id: String,
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    lastLogin: Date,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createBloodBankUser() {
    try {
        await mongoose.connect('mongodb://localhost:27017/blood-monolith');
        console.log('Connected to MongoDB');

        // Hash the password
        const hashedPassword = await bcrypt.hash('bloodbank123', 10);

        // Create the user
        const user = new User({
            email: 'bloodbank@test.com',
            password: hashedPassword,
            name: 'Test Blood Bank',
            role: 'bloodbank',
            hospital_id: 'hospital1',
            isActive: true
        });

        await user.save();
        console.log('✅ Blood Bank user created successfully!');
        console.log('Email: bloodbank@test.com');
        console.log('Password: bloodbank123');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createBloodBankUser();
