
const mongoose = require('mongoose');

async function forensicSearch() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        console.log("Connected. Starting Forensic Search for 'TK-DKCRT7'...");

        // 1. Check the specific booking for donor/requester name comparison
        const booking = await db.collection('bookings').findOne({ tokenNumber: /TK-DKCRT7/i });
        if (booking) {
            console.log("--- BOOKING FOUND ---");
            console.log(`ID: ${booking._id}`);
            console.log(`Token: ${booking.tokenNumber}`);
            console.log(`DonorName: '${booking.donorName}'`);
            console.log(`RequesterName: '${booking.requesterName}'`);
            console.log(`PatientName: '${booking.patientName}'`);
            console.log(`PatientMRID: '${booking.patientMRID}'`);
            console.log(`Meta:`, booking.meta);
            console.log(`All Keys:`, Object.keys(booking));
        } else {
            console.log("--- BOOKING NOT FOUND ---");
        }

        // 2. Search ALL collections for this token string
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            if (col.name === 'system.indexes') continue;

            // Text search in string fields?
            // Simple approach: find one where logic matches
            // We can't easily grep mongo without aggregation or finding keys.
            // Let's try basic regex on ANY field if possible? 
            // MongoDB doesn't support "Any field" regex easily without $where (slow).
            // We will search specific likely fields: token, tokenNumber, bookingToken, requestToken

            const count = await db.collection(col.name).countDocuments({
                $or: [
                    { tokenNumber: /TK-DKCRT7/i },
                    { token: /TK-DKCRT7/i },
                    { bookingToken: /TK-DKCRT7/i },
                    { _id: /TK-DKCRT7/i }, // rare but possible if string id
                    { description: /TK-DKCRT7/i },
                    { notes: /TK-DKCRT7/i }
                ]
            });

            if (count > 0) {
                console.log(`\nFound ${count} matches in collection: '${col.name}'`);
                const docs = await db.collection(col.name).find({
                    $or: [
                        { tokenNumber: /TK-DKCRT7/i },
                        { token: /TK-DKCRT7/i },
                        { bookingToken: /TK-DKCRT7/i },
                        { description: /TK-DKCRT7/i }
                    ]
                }).toArray();
                docs.forEach(d => {
                    console.log(`[${col.name}] Doc ID: ${d._id}`);
                    console.log(JSON.stringify(d, null, 2));
                });
            }
        }

    } catch (e) { console.error(e); } finally { await mongoose.disconnect(); }
}
forensicSearch();
