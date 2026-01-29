
const mongoose = require('mongoose');
const User = require('./src/modules/auth/models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://blood-db:27017/blood-monolith')
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            const email = 'staff@store.com';
            const password = 'password123';

            console.log(`Attempting login verification for: ${email}`);

            const user = await User.findOne({ email });

            if (!user) {
                console.log('❌ User not found!');
            } else {
                console.log(`✅ User found: ${user.email} (Role: ${user.role}, ID: ${user._id})`);
                console.log(`Stored Hashed Password: ${user.password}`);

                const isMatch = await user.comparePassword(password);
                if (isMatch) {
                    console.log('✅ Password VALID');
                } else {
                    console.log('❌ Password INVALID');
                }
            }

        } catch (err) {
            console.error('Error:', err);
        } finally {
            mongoose.connection.close();
            process.exit(0);
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
