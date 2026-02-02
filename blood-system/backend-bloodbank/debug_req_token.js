
const mongoose = require('mongoose');

async function searchTokenInRequests() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        console.log("Searching for TK-DKCRT7 in donationrequests...");
        const req = await db.collection('donationrequests').findOne({
            $or: [
                { tokenNumber: /TK-DKCRT7/i },
                { "bookingDetails.tokenNumber": /TK-DKCRT7/i }
            ]
        });

        if (req) {
            console.log("FOUND REQUEST:", JSON.stringify(req, null, 2));
        } else {
            console.log("Not found in donationrequests");
        }

    } catch (e) { console.error(e); } finally { await mongoose.disconnect(); }
}
searchTokenInRequests();
