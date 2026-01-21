const mongoose = require('mongoose');
const Booking = require('./Models/Booking');
const BloodBank = require('./Models/BloodBank');
const User = require('./Models/User');

const MONGO_URI = 'mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function investigate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const bookings = await Booking.find().sort({ createdAt: -1 }).limit(5);

        console.log(`Found ${bookings.length} recent bookings.`);

        for (const b of bookings) {
            if (b.bookingId === 'BK-20260117-0002') continue; // Skip mine

            console.log(`\nChecking Booking: ${b._id}`);
            console.log(`Status: ${b.status}, Token: ${b.tokenNumber}`);
            console.log(`BloodBankID: ${b.bloodBankId}`);

            if (b.bloodBankId) {
                const bb = await BloodBank.findById(b.bloodBankId);
                console.log(` -> BB Name: ${bb ? bb.name : 'Not Found'}`);

                // Users
                const staff = await User.find({ bloodBankId: b.bloodBankId });
                console.log(` -> Staff for this BB: ${staff.map(u => u.username).join(', ')}`);

                if (bb && bb.userId) {
                    const owner = await User.findById(bb.userId);
                    console.log(` -> BB Owner: ${owner ? owner.username : 'Not Found'}`);
                }
            } else {
                console.log(' -> NO BLOOD BANK LINKED (Orphaned Booking)');
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

investigate();
