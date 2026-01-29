
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB using the internal container URI
mongoose.connect(process.env.MONGODB_URI || 'mongodb://blood-db:27017/blood-monolith')
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            const userSchema = new mongoose.Schema({
                email: String,
                password: String,
                name: String,
                role: String,
                hospital_id: String,
                isActive: Boolean
            }, { strict: false });

            const User = mongoose.model('User', userSchema, 'users');

            // Store Staff User
            const email = 'staff@store.com';
            let user = await User.findOne({ email });

            const hospital_id = 'Test Hospital'; // Using standard test hospital

            if (user) {
                console.log('Store Staff already exists. Updating...');
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash('password123', salt);
                user.role = 'store_staff';
                user.hospital_id = hospital_id;
                user.name = 'Store Staff';
                await user.save();
            } else {
                console.log('Creating Store Staff...');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('password123', salt);

                user = new User({
                    name: 'Store Staff',
                    email: email,
                    password: hashedPassword,
                    role: 'store_staff',
                    hospital_id: hospital_id, // Match the manager's hospital
                    isActive: true
                });
                await user.save();
            }

            console.log('Store Staff Created/Updated:');
            console.log('Email: staff@store.com');
            console.log('Password: password123');
            console.log('Role: store_staff');

        } catch (err) {
            console.error('Error:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error('Connection error:', err));
