const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://blood-db:27017/blood-monolith')
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            // Define minimal schemas if models not loaded
            const userSchema = new mongoose.Schema({}, { strict: false });
            const User = mongoose.model('User', userSchema);

            const bookingSchema = new mongoose.Schema({}, { strict: false });
            const Booking = mongoose.model('Booking', bookingSchema);

            console.log('\n--- Blood Bank Users ---');
            const bloodBanks = await User.find({ role: 'bloodbank' }, { name: 1, email: 1, hospital_id: 1 });
            bloodBanks.forEach(b => console.log(`BloodBank: ${b.name} (${b.email}) - ID: ${b.hospital_id}, _id: ${b._id}`));

            console.log('\n--- Bookings ---');
            const bookings = await Booking.find({}, { hospital_id: 1, donorName: 1, status: 1 });
            bookings.forEach(b => console.log(`Booking: ${b.donorName} (${b.status}) - HospID: ${b.hospital_id}`));

        } catch (err) {
            console.error(err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error('Connection error:', err));
