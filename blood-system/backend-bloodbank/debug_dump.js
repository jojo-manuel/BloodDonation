
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');

async function dumpBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const bookings = await Booking.find().sort({ createdAt: -1 }).limit(3);
        console.log("Dumping last 3 bookings:");
        console.log(JSON.stringify(bookings, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

dumpBookings();
