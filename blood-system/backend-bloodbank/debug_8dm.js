
const mongoose = require('mongoose');

async function debug8DM() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const booking = await db.collection('bookings').findOne({ tokenNumber: /TK-8DM7XY/i });
        if (booking) {
            console.log("Tok:", booking.tokenNumber);
            console.log("Patient:", booking.patientName);
            console.log("MRID:", booking.patientMRID);
            console.log("Meta:", booking.meta);
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
debug8DM();
