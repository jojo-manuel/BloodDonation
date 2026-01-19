const mongoose = require('mongoose');
const Patient = require('./src/modules/patient/models/Patient');

async function inspectPatients() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://blood-db:27017/blood-monolith';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected.');

        const patients = await Patient.find({});
        console.log(`\nTotal Patients in DB: ${patients.length}`);

        if (patients.length > 0) {
            console.log('\n--- Patient List ---');
            patients.forEach((p, i) => {
                console.log(`${i + 1}. Name: ${p.patientName}`);
                console.log(`   MRID: ${p.mrid}`);
                console.log(`   Hospital ID: ${p.hospital_id} (Type: ${typeof p.hospital_id})`);
                console.log(`   Blood Group: ${p.bloodGroup}`);
                console.log('---------------------');
            });
        } else {
            console.log('No patients found in the database.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspectPatients();
