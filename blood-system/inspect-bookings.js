const mongoose = require('mongoose');

mongoose.connect('mongodb://blood-db:27017/blood-monolith')
    .then(async () => {
        console.log('--- Current Bookings ---');
        const bookings = await mongoose.model('Booking', new mongoose.Schema({}, { strict: false })).find({});

        bookings.forEach(b => {
            console.log(`ID: ${b._id}`);
            console.log(`   Donor: ${b.donorName}`);
            console.log(`   Status: ${b.status}`);
            console.log(`   Date: ${b.date}`);
            console.log(`   HospID: ${b.hospital_id}`);
            console.log('-------------------------');
        });

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
