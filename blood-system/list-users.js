const mongoose = require('mongoose');

mongoose.connect('mongodb://blood-db:27017/blood-monolith')
    .then(async () => {
        const users = await mongoose.model('User', new mongoose.Schema({}, { strict: false })).find({ role: 'bloodbank' });
        console.log('--- Blood Bank Users ---');
        users.forEach(u => {
            console.log(`User: ${u.name} | Username: ${u.username} | HospID: '${u.hospital_id}' | _id: ${u._id}`);
        });
        mongoose.disconnect();
    })
    .catch(err => console.error(err));
