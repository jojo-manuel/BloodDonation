const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/blood-monolith')
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            // Define Schemas
            const userSchema = new mongoose.Schema({
                email: String,
                hospital_id: String,
                name: String
            }, { strict: false });

            const bookingSchema = new mongoose.Schema({
                tokenNumber: String,
                hospital_id: String,
                status: String,
                donorName: String,
                bloodGroup: String,
                age: Number,
                gender: String,
                date: Date
            }, { strict: false });

            const User = mongoose.model('User', userSchema, 'users');
            const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

            // 1. Find the Doctor to get the exact Hospital ID
            const doctorEmail = 'sane@gmail.com';
            const doctor = await User.findOne({ email: doctorEmail });

            if (!doctor) {
                console.error(`Doctor ${doctorEmail} not found! Cannot create booking.`);
                return;
            }

            console.log(`Found Doctor: ${doctor.name}`);
            console.log(`Hospital ID: '${doctor.hospital_id}'`);

            // 2. Check if 'mv33' already exists
            const existing = await Booking.findOne({
                tokenNumber: 'mv33',
                hospital_id: doctor.hospital_id
            });

            if (existing) {
                console.log('Booking for mv33 already exists, updating status to confirmed...');
                existing.status = 'confirmed';
                await existing.save();
                console.log('Updated.');
            } else {
                // 3. Create 'mv33' booking
                console.log('Creating new booking for token: mv33...');
                const newBooking = new Booking({
                    tokenNumber: 'mv33',
                    bookingId: 'BK-TEST-MV33',
                    hospital_id: doctor.hospital_id, // Match the doctor's hospital
                    status: 'confirmed',             // Ready for doctor
                    donorName: 'Test Donor (mv33)',
                    bloodGroup: 'O+',
                    age: 25,
                    gender: 'Male',
                    weight: 70,
                    email: 'test@mv33.com',
                    phone: '1234567890',
                    date: new Date()
                });

                await newBooking.save();
                console.log('✅ Success! Created booking for token "mv33".');
            }

        } catch (err) {
            console.error('Error:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error('Connection error:', err));
