const mongoose = require('mongoose');
// We need to find where Patient model is.
// Dockerfile copies backend-monolith/src/modules/patient/ -> ./src/modules/patient/
// So relative to /app (WORKDIR), it is src/modules/patient/models/Patient.js

// But require inside the container:
const Patient = require('./src/modules/patient/models/Patient');

async function run() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://blood-db:27017/blood-monolith';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected');

        const hospitalId = '695f850f9a2922c8c8c4e4fc';

        const count = await Patient.countDocuments({ hospital_id: hospitalId });
        console.log(`Patients with hospital_id ${hospitalId}: ${count}`);

        if (count === 0) {
            console.log('Seeding a test patient...');
            await Patient.create({
                patientName: 'Test Patient A',
                mrid: 'MRID-TEST-001',
                bloodGroup: 'O+',
                hospital_id: hospitalId,
                address: {
                    houseName: 'Test House',
                    city: 'Test City',
                    state: 'Test State'
                },
                phoneNumber: '1234567890'
            });
            console.log('Seeded successfully.');
        }

        // List all just in case
        const all = await Patient.find({});
        console.log('Total patients in DB:', all.length);
        all.forEach(p => console.log(`- ${p.patientName} (${p.hospital_id})`));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
