
const mongoose = require('mongoose');

async function debugRaw() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const db = mongoose.connection.db;

        // Find booking raw
        const booking = await db.collection('bookings').findOne({
            tokenNumber: { $regex: 'TK-DKCRT7', $options: 'i' }
        });

        if (!booking) {
            console.log("Booking not found via raw query");
        } else {
            console.log("RAW BOOKING:", JSON.stringify(booking, null, 2));

            if (booking.donationRequestId) {
                console.log(`\nFound donationRequestId: ${booking.donationRequestId}`);

                // Try to find the request
                const request = await db.collection('donationrequests').findOne({
                    _id: booking.donationRequestId
                });

                if (request) {
                    console.log("RAW REQUEST:", JSON.stringify(request, null, 2));
                } else {
                    console.log("Request not found in 'donationrequests' collection");
                    // Try 'requests' collection just in case
                    const request2 = await db.collection('requests').findOne({
                        _id: booking.donationRequestId
                    });
                    if (request2) console.log("RAW REQUEST (from 'requests'):", JSON.stringify(request2, null, 2));
                }
            } else {
                console.log("No donationRequestId in booking");
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debugRaw();
