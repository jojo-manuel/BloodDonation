const mongoose = require('mongoose');
const Booking = require('./Models/Booking');
const DonationRequest = require('./Models/DonationRequest');

const MONGO_URI = 'mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const targetId = 'BK-20260117-0002';

        // Check Bookings by bookingId
        const b1 = await Booking.findOne({ bookingId: targetId });
        if (b1) {
            console.log(`[FOUND] In Bookings (bookingId):`, JSON.stringify(b1, null, 2));
        } else {
            console.log(`[NOT FOUND] In Bookings by bookingId: ${targetId}`);
        }

        // Check Bookings by regex BK-
        const bkBookings = await Booking.find({ bookingId: /BK-/ });
        if (bkBookings.length > 0) {
            console.log(`[INFO] Found ${bkBookings.length} other BK- bookings:`);
            bkBookings.forEach(b => console.log(` - ${b.bookingId}`));
        } else {
            console.log(`[INFO] No bookings found starting with BK-`);
        }

        // List all just in case
        const all = await Booking.find({}, 'bookingId date');
        console.log(`[INFO] Total Bookings: ${all.length}`);
        all.forEach(b => console.log(` - ${b.bookingId} (${b.date})`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
