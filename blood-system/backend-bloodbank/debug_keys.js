
const mongoose = require('mongoose');

async function debugKeys() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const booking = await db.collection('bookings').findOne({ tokenNumber: /TK-8DM7XY/i });
        if (booking) {
            console.log("Keys found:", Object.keys(booking));
            console.log("Values for interesting keys:");
            ['patientName', 'patientMRID', 'donorName', 'meta', 'requesterName', 'patientId'].forEach(k => {
                console.log(`${k}: ${JSON.stringify(booking[k])}`);
            });
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
debugKeys();
