
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
// Mocking the model since we might not have easy access to all models inside simple script if paths differ
// But since we are running inside container where structure is preserved...
// /app/src/models/Booking.js should exist.

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // Find bookings with regex for token
        const bookings = await Booking.find({
            tokenNumber: { $regex: 'TK', $options: 'i' }
        }).sort({ createdAt: -1 }).limit(5);

        console.log("Recent 5 Bookings:");
        bookings.forEach(b => {
            console.log(`Token: ${b.tokenNumber}, Donor: ${b.donorName}, Patient: ${b.patientName}, MRID: ${b.patientMRID}`);
        });

        const target = bookings.find(b => b.tokenNumber && b.tokenNumber.includes('DKCRT'));
        if (target) {
            console.log("\nTarget Booking Full:", JSON.stringify(target, null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
