const mongoose = require('mongoose');

async function seed() {
    const MONGODB_URI = 'mongodb://localhost:27017/blood-monolith';
    await mongoose.connect(MONGODB_URI);

    const patientData = {
        patientName: 'Selenium Test Patient',
        mrid: '402',
        bloodGroup: 'O+',
        phoneNumber: '9999999999',
        requiredUnits: 2,
        requiredDate: new Date(),
        hospital_id: 'hospital1',
        createdAt: new Date()
    };

    await mongoose.connection.db.collection('patients').deleteOne({ mrid: '402' });
    await mongoose.connection.db.collection('patients').insertOne(patientData);
    console.log('✅ Seeded patient 402 (O+)');

    await mongoose.disconnect();
}
seed();
