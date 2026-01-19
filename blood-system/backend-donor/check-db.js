const mongoose = require('mongoose');
const Patient = require('./src/modules/donor/models/PatientModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://blood-db:27017/blood-monolith';

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const patients = await Patient.find({});
        console.log(`Found ${patients.length} patients in total.`);

        patients.forEach(p => {
            console.log(`- Name: ${p.patientName}, MRID: ${p.mrid}, BloodGroup: ${p.bloodGroup}, Hospital: ${p.hospital_id}`);
        });

        // Check specifically for an MRID if provided as arg, though printing all is fine for small datasets
        if (process.argv[2]) {
            const mrid = process.argv[2];
            const p = await Patient.findOne({ mrid: { $regex: new RegExp(`^${mrid}$`, 'i') } });
            console.log(`\nSearching for MRID '${mrid}':`, p ? 'Found' : 'Not Found');
            if (p) console.log(p);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
