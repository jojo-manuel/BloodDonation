const mongoose = require('mongoose');
const Booking = require('./Models/Booking');
const BloodBank = require('./Models/BloodBank');

const MONGO_URI = 'mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkRecent() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const bookings = await Booking.find().sort({ createdAt: -1 }).limit(5);

        console.log(`Found ${bookings.length} recent bookings.`);

        for (const b of bookings) {
            console.log('--- BOOKING ---');
            console.log(`ID: ${b.bookingId || b._id}`);
            console.log(`Created: ${b.createdAt}`);
            console.log(`Status: ${b.status}`);

            if (b.bloodBankId) {
                const bb = await BloodBank.findById(b.bloodBankId);
                console.log(`Blood Bank: ${bb ? bb.name : 'Unknown ID'} (${b.bloodBankId})`);
            } else {
                console.log('⚠️ Blood Bank: NULL/UNDEFINED');
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkRecent();
