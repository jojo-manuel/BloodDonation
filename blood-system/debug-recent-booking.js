
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend-bloodbank/.env' });
const Booking = require('./backend-bloodbank/src/models/Booking');

async function checkBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const booking = await Booking.findOne().sort({ createdAt: -1 });
        console.log('Latest Booking:', JSON.stringify(booking, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBookings();
