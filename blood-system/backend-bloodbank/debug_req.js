
const mongoose = require('mongoose');

async function debugReqName() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const booking = await db.collection('bookings').findOne({ tokenNumber: /TK-DKCRT7/i });
        if (booking) {
            console.log("RequesterName:", booking.requesterName);
            console.log("Status:", booking.status);
            console.log("PatientName:", booking.patientName);
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
debugReqName();
