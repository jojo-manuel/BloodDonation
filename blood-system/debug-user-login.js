const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend-login/src/modules/auth/models/User'); // Adjust path as needed

// Configuration
const MONGODB_URI = 'mongodb://localhost:27017/blood-monolith';
const CHECK_EMAIL = process.argv[2]; // Get email from command line
const CHECK_PASSWORD = process.argv[3]; // Get password from command line

if (!CHECK_EMAIL || !CHECK_PASSWORD) {
    console.log('Usage: node debug-user-login.js <email> <password>');
    process.exit(1);
}

async function debugLogin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log(`🔍 Searching for user: ${CHECK_EMAIL}`);
        const user = await User.findOne({ email: CHECK_EMAIL });

        if (!user) {
            console.log('❌ User NOT FOUND.');
        } else {
            console.log('✅ User FOUND:');
            console.log(`   ID: ${user._id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Hospital ID: ${user.hospital_id}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Stored Password Hash: ${user.password}`);

            console.log('🔐 Verifying password...');
            const isMatch = await bcrypt.compare(CHECK_PASSWORD, user.password);

            if (isMatch) {
                console.log('✅ Password MATCHES!');
            } else {
                console.log('❌ Password DOES NOT MATCH.');

                // Debug hash generation
                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash(CHECK_PASSWORD, salt);
                console.log(`   If you hashed '${CHECK_PASSWORD}' now, it would look like: ${newHash}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugLogin();
