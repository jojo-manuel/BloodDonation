
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Patient = require('./src/models/Patient');

async function debugLookup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // 1. Find the specific booking causing issues (assuming token TK-8DM7XY or similar from previous context, or just find regex)
        // Let's look for any booking with an MRID
        const bookingsWithMRID = await Booking.find({
            tokenNumber: { $exists: true }, // ensure it's a booking with token
            patientMRID: { $ne: null }      // and has an MRID
        }).sort({ createdAt: -1 }).limit(5);

        console.log(`Found ${bookingsWithMRID.length} bookings with MRID to test.`);

        for (const b of bookingsWithMRID) {
            console.log("---------------------------------------------------");
            console.log(`Checking Booking Token: ${b.tokenNumber}`);
            console.log(`Booking MRID: '${b.patientMRID}'`);
            console.log(`Booking PatientName: '${b.patientName}' (Stored in Booking)`);
            console.log(`Booking DonorName: '${b.donorName}'`);

            if (b.patientMRID) {
                // Try exact match lookup
                const p1 = await Patient.findOne({ mrid: b.patientMRID });
                if (p1) {
                    console.log(`✅ MATCH FOUND (Exact): Patient Name is '${p1.patientName}'`);
                } else {
                    console.log(`❌ NO MATCH (Exact) for MRID '${b.patientMRID}'`);

                    // Try case insensitive regex lookup
                    const p2 = await Patient.findOne({ mrid: { $regex: new RegExp(`^${b.patientMRID}$`, 'i') } });
                    if (p2) {
                        console.log(`✅ MATCH FOUND (Case-Insensitive): Patient Name is '${p2.patientName}'`);
                    } else {
                        console.log(`❌ NO MATCH (Case-Insensitive) either.`);
                    }
                }
            } else {
                console.log("Skipping lookup, MRID is null/empty");
            }
        }

    } catch (e) {
        console.error("Debug Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

debugLookup();
