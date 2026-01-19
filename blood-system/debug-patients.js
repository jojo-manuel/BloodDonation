const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://blood-db:27017/blood-monolith', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    checkPatients();
}).catch(err => {
    console.error('Connection error:', err);
});

async function checkPatients() {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const patients = await mongoose.connection.db.collection('patients').find({}).limit(5).toArray();
        console.log('Patients Data Sample:');
        patients.forEach(p => {
            console.log(JSON.stringify(p, null, 2));
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}
