
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend-bloodbank/.env' });
const Booking = require('./src/models/Booking');

async function checkBooking() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find booking with token TK-DKCRT7
        // Token stored might be "TK-DKCRT7" or regex match
        const booking = await Booking.findOne({
            tokenNumber: { $regex: /TK-DKCRT7/i }
        });

        if (booking) {
            console.log('Found Booking:', JSON.stringify(booking, null, 2));
        } else {
            console.log('Booking TK-DKCRT7 not found');
            // List a few recent bookings to debug
            const recent = await Booking.find().sort({ createdAt: -1 }).limit(3);
            console.log('Recent bookings:', JSON.stringify(recent, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBooking();
