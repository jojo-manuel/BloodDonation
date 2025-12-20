// Create Blood Bank User and Profile
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');
const BloodBank = require('./Models/BloodBank');

const MONGO_URI = process.env.MONGO_URI;

async function createBloodBankUser() {
    try {
        console.log('\n🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const bloodBankUser = {
            username: 'redcross@blooddonation.com',
            name: 'Red Cross Blood Bank',
            email: 'redcross@blooddonation.com',
            password: 'Bank123!@#',
            role: 'bloodbank',
            provider: 'local'
        };

        // Check if user already exists
        let user = await User.findOne({ username: bloodBankUser.username });

        if (user) {
            console.log(`⚠️  User already exists: ${bloodBankUser.email}`);
        } else {
            // Create new user
            user = new User(bloodBankUser);
            await user.save();
            console.log(`✅ Created user: ${bloodBankUser.email}`);
        }

        // Check if BloodBank profile exists
        const existingProfile = await BloodBank.findOne({ userId: user._id });

        if (existingProfile) {
            console.log(`⚠️  Blood Bank profile already exists for this user`);
        } else {
            // Create Blood Bank profile
            const bloodBankProfile = new BloodBank({
                userId: user._id,
                name: 'Red Cross Blood Center',
                hospitalName: 'Red Cross Hospital',
                address: '123 Health Avenue, Medical District',
                email: bloodBankUser.email,
                phone: '9876543210',
                contactNumber: '9876543210',
                pincode: '110001',
                localBody: 'New Delhi Municipal Council',
                district: 'New Delhi',
                state: 'Delhi',
                licenseNumber: 'BB-LIC-2024-001',
                status: 'approved', // Auto-approve for testing
                isBlocked: false,
                isSuspended: false
            });

            await bloodBankProfile.save();
            console.log(`✅ Created Blood Bank profile: ${bloodBankProfile.name}`);
        }

        console.log('='.repeat(60));
        console.log('\n🎉 Blood Bank User Ready!');
        console.log('\nCredentials:');
        console.log(`   Email: ${bloodBankUser.email}`);
        console.log(`   Password: ${bloodBankUser.password}`);
        console.log('\n   Status: Approved (Ready to login)');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error creating blood bank user:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`   - ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
}

createBloodBankUser();
