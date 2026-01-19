const mongoose = require('mongoose');

mongoose.connect('mongodb://blood-db:27017/blood-monolith');

const User = mongoose.model('User', new mongoose.Schema({
    name: String, email: String, role: String, hospital_id: String
}, { strict: false }));

const Booking = mongoose.model('Booking', new mongoose.Schema({
    date: Date, hospital_id: String, donorName: String, status: String, bookingId: String
}, { strict: false }));

async function recreateAbyson() {
    try {
        console.log('Recreating Abyson...');

        // 1. Create User
        let user = await User.findOne({ email: 'abyson@example.com' });
        if (!user) {
            user = await User.create({
                name: 'Abyson',
                email: 'abyson@example.com',
                password: 'password123', // Hash if needed, but this is mock
                role: 'user',
                hospital_id: 'public-user'
            });
            console.log('User Abyson created.');
        } else {
            console.log('User Abyson already exists.');
        }

        // 2. Find Blood Bank to attach booking to
        // We'll attach it to "Test Blood Bank" or the first one found
        const bb = await User.findOne({ role: 'bloodbank' });
        if (!bb) {
            console.log('No blood bank found to attach booking.');
            return;
        }

        // 3. Create Booking
        const today = new Date();
        // today.setHours(0,0,0,0);

        await Booking.create({
            hospital_id: bb.hospital_id,
            donorId: user._id,
            donorName: 'Abyson',
            bloodGroup: 'AB+', // Assuming
            date: today,
            time: '02:00 PM',
            status: 'pending',
            tokenNumber: '9999',
            bookingId: `BK-${bb.hospital_id}-ABY`,
            patientName: 'N/A'
        });

        console.log(`Booking for Abyson created at ${bb.name} (${bb.hospital_id})`);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

recreateAbyson();
