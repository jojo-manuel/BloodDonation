const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

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
            console.log(`  Active: ${u.isActive}`);
            console.log('---');
        });

        const admin = await User.findOne({ role: 'BLOODBANK_ADMIN' });
        if (admin) console.log('BLOODBANK_ADMIN found:', admin._id);
        else console.log('No BLOODBANK_ADMIN found.');

        // Check for bloodbank role
        const managers = await User.find({ role: 'bloodbank' });
        console.log(`Found ${managers.length} bloodbank managers.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkUsers();
