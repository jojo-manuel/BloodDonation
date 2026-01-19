const mongoose = require('mongoose');
const Patient = require('./src/modules/patient/models/Patient');

async function deleteTestPatient() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://blood-db:27017/blood-monolith';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected.');

        const result = await Patient.deleteMany({
            mrid: "MRID-TEST-001"
        });

        console.log(`Deleted ${result.deletedCount} patient(s) with MRID: MRID-TEST-001`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

deleteTestPatient();
