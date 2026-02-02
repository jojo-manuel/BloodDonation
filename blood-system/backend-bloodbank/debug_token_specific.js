
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Patient = require('./src/models/Patient');

async function debugSpecific() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // Find specific token
        const token = "TK-DKCRT7"; // case insensitive usually
        const booking = await Booking.findOne({
            tokenNumber: { $regex: new RegExp(`^${token}$`, 'i') }
        });

        if (!booking) {
            console.log(`Booking ${token} not found!`);
            // List all tokens
            const all = await Booking.find({}, 'tokenNumber');
            console.log("Available tokens:", all.map(b => b.tokenNumber));
            return;
        }

        console.log("Booking Found:");
        console.log("Token:", booking.tokenNumber);
        console.log("PatientMRID:", booking.patientMRID);
        console.log("PatientName (Booking):", booking.patientName);
        console.log("Hospital ID:", booking.hospital_id);

        if (booking.patientMRID) {
            console.log(`\nAttempting Patient Lookup for MRID '${booking.patientMRID}'...`);
            const p = await Patient.findOne({ mrid: booking.patientMRID });
            if (p) {
                console.log("✅ Patient Found:", JSON.stringify(p, null, 2));

                if (p.hospital_id !== booking.hospital_id) {
                    console.log("⚠️ WARNING: Hospital ID mismatch!");
                    console.log(`Patient Hospital: ${p.hospital_id}`);
                    console.log(`Booking Hospital: ${booking.hospital_id}`);
                }
            } else {
                console.log("❌ Patient NOT found in DB with this MRID.");
                // Try loose matching
                const pLoose = await Patient.findOne({ mrid: { $regex: new RegExp(booking.patientMRID, 'i') } });
                if (pLoose) {
                    console.log("...but found with case-insensitive search:", pLoose.mrid);
                }
            }
        } else {
            console.log("\n⚠️ Booking has NO MRID. Cannot lookup patient.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debugSpecific();
