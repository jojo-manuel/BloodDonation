const mongoose = require('mongoose');

// Adjust URI if needed. Assuming default local mapping or internal network if running in container.
// Since I'm running this on host, I'll try localhost.
const MONGODB_URI = 'mongodb://localhost:27017/blood-monolith';

const patientSchema = new mongoose.Schema({
    patientName: String,
    mrid: String,
    hospital_id: String
});

const Patient = mongoose.model('Patient', patientSchema);

async function checkPatients() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const patients = await Patient.find({});
        console.log(`Found ${patients.length} total patients.`);

        patients.forEach(p => {
            console.log(`- Name: ${p.patientName}, MRID: ${p.mrid}, Hospital ID: ${p.hospital_id}, ID Type: ${typeof p.hospital_id}`);
        });

        const targetId = '695f850f9a2922c8c8c4e4fc';
        const matches = patients.filter(p => p.hospital_id === targetId);
        console.log(`\nChecking for target ID: ${targetId}`);
        console.log(`Matches found: ${matches.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkPatients();
