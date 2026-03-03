const mongoose = require('mongoose');

async function checkDonors() {
    const MONGODB_URI = 'mongodb://localhost:27017/blood-monolith';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    try {
        const donors = await mongoose.connection.db.collection('donors').find({}).toArray();
        console.log('Total donors in DB:', donors.length);

        // Find some B+ donors for testing
        const bPlusDonors = await mongoose.connection.db.collection('donors').find({ bloodGroup: 'B+' }).toArray();
        console.log('B+ donors count:', bPlusDonors.length);
        if (bPlusDonors.length > 0) {
            console.log('Sample B+ donor:', bPlusDonors[0].name, bPlusDonors[0].email || bPlusDonors[0].contactNumber);
        }

        // Find a random patient to get an MRID
        const patient = await mongoose.connection.db.collection('patients').findOne({});
        if (patient) {
            console.log('Found a patient MRID for testing:', patient.mrid, 'Name:', patient.patientName, 'Blood Group:', patient.bloodGroup);
        } else {
            console.log('No patients found in DB.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }

    await mongoose.disconnect();
}

checkDonors();
