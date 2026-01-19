const mongoose = require('mongoose');

mongoose.connect('mongodb://blood-db:27017/blood-monolith')
    .then(async () => {
        try {
            console.log('--- Checking Bookings ---');
            // Use existing model if available, or define new schema-less one
            const Booking = mongoose.models.Booking || mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));

            const bookings = await Booking.find({});
            console.log(`Found ${bookings.length} bookings.`);

            bookings.forEach(b => {
                console.log(`ID: ${b._id}`);
                console.log(`   DonationRequestId: ${b.donationRequestId}`);
                console.log(`   Status: ${b.status}`);
                console.log(`   Date: ${b.date} (Type: ${typeof b.date})`);
                console.log(`   HospitalID: '${b.hospital_id}'`);
                console.log(`   DonorName: ${b.donorName}`);
                console.log('---------------------------');
            });

        } catch (err) {
            console.error(err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error('Connection Error:', err));
