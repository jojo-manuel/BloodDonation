const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Use MONGODB_URI from env (set in docker-compose)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:example@blood-db:27017/blood-system?authSource=admin';

const checkUsers = async () => {
    try {
        console.log('Connecting to MongoDB at:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected.');

        const users = await User.find({});
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ID: ${u._id}`);
            console.log(`  Name: ${u.name}`);
            console.log(`  Username: ${u.username}`);
            console.log(`  Role: ${u.role}`);
            console.log(`  HospitalId: ${u.hospital_id}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkUsers();
