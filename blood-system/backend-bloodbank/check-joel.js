const mongoose = require('mongoose');
const Patient = require('./src/modules/patient/models/Patient');

async function checkPatient() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://blood-db:27017/blood-monolith';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected.');

        const searchName = "Joel John";
        // Case-insensitive regex search
        const patients = await Patient.find({
            patientName: { $regex: new RegExp(searchName, 'i') }
        });

        console.log(`\nSearching for "${searchName}"...`);

        if (patients.length > 0) {
            console.log(`Found ${patients.length} match(es):`);
            patients.forEach((p, i) => {
                console.log(`\n${i + 1}. Name: ${p.patientName}`);
                console.log(`   MRID: ${p.mrid}`);
                console.log(`   Hospital ID: ${p.hospital_id}`);
                console.log(`   Blood Group: ${p.bloodGroup}`);
            });
        } else {
            console.log('No patient found with that name.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkPatient();
