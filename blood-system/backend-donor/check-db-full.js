const mongoose = require('mongoose');
const Patient = require('./src/modules/donor/models/PatientModel');
const Donor = require('./src/modules/donor/models/donorModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://blood-db:27017/blood-monolith';

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const patients = await Patient.find({});
        console.log(`\n--- PATIENTS (${patients.length}) ---`);
        patients.forEach(p => {
            console.log(`Name: ${p.patientName || p.name}, MRID: ${p.mrid}, BG: ${p.bloodGroup}`);
        });

        const donors = await Donor.find({});
        console.log(`\n--- DONORS (${donors.length}) ---`);
        donors.forEach(d => {
            console.log(`ID: ${d._id}, BG: ${d.bloodGroup}, Avail: ${d.availability}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
