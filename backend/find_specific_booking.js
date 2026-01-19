const mongoose = require('mongoose');
const Booking = require('./Models/Booking');
const Donor = require('./Models/donor');
const User = require('./Models/User');

const MONGO_URI = 'mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function listBookings() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const bookings = await Booking.find({}, 'bookingId status date');
        console.log(`Found ${bookings.length} total bookings.`);
        bookings.forEach(b => {
            console.log(`- ${b.bookingId} (${b.status}) on ${b.date}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listBookings();
