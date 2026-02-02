
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');

async function debugFull() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const token = "TK-DKCRT7";
        const booking = await Booking.findOne({
            tokenNumber: { $regex: new RegExp(`^${token}$`, 'i') }
        });

        if (booking) {
            console.log("Full Booking Dump:", JSON.stringify(booking, null, 2));
        } else {
            console.log("Booking not found");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debugFull();
