const mongoose = require('mongoose');

mongoose.connect('mongodb://blood-db:27017/blood-monolith')
    .then(async () => {
        console.log('Connected to MongoDB');

        const bookingSchema = new mongoose.Schema({}, { strict: false });
        const Booking = mongoose.model('Booking', bookingSchema);

        // Update all bookings to have the correct hospital_id
        // Also ensure donorName and other required fields are present
        const result = await Booking.updateMany(
            {},
            {
                $set: {
                    hospital_id: 'Test Hospital',
                    donorName: 'Test Donor', // Default if missing
                    bookingId: 'BK-TEST-' + Math.floor(Math.random() * 1000)
                }
            }
        );

        console.log('Update Result:', result);

        // List them to verify
        const updated = await Booking.find({});
        updated.forEach(b => console.log(`Updated Booking: ${b._id} - HospID: ${b.hospital_id}`));

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
