const mongoose = require('mongoose');

async function check() {
    const MONGODB_URI = 'mongodb://localhost:27017/blood-monolith';
    await mongoose.connect(MONGODB_URI);

    const patient = await mongoose.connection.db.collection('patients').findOne({ mrid: '402' });
    console.log('Patient 402:', patient ? 'Found' : 'Not Found');
    if (patient) console.log('Blood Group:', patient.bloodGroup);

    const donors = await mongoose.connection.db.collection('donors').find({}).toArray();
    console.log('Donors found:', donors.map(d => `${d.name} (${d.bloodGroup})`));

    await mongoose.disconnect();
}
check();
