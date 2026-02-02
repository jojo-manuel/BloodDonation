
const mongoose = require('mongoose');

async function debugShort() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const booking = await db.collection('bookings').findOne({ tokenNumber: /TK-DKCRT7/i });
        if (booking) {
            console.log("Tok:", booking.tokenNumber);
            console.log("ReqID:", booking.donationRequestId);
            console.log("Meta:", booking.meta);
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
debugShort();
