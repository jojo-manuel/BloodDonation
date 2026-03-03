const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function reset() {
    const MONGODB_URI = 'mongodb://localhost:27017/blood-monolith';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const hashedPassword = await bcrypt.hash('Jeevan123!@#', 10);

    const result = await mongoose.connection.db.collection('users').updateOne(
        { email: 'jeevan@gmail.com' },
        { $set: { password: hashedPassword } }
    );

    if (result.matchedCount > 0) {
        console.log('✅ Updated jeevan@gmail.com password to Jeevan123!@#');
    } else {
        // If user doesn't exist, create it as a bloodbank admin
        await mongoose.connection.db.collection('users').insertOne({
            email: 'jeevan@gmail.com',
            password: hashedPassword,
            name: 'Jeevan Admin',
            role: 'bloodbank',
            hospital_id: 'hospital1',
            isActive: true,
            createdAt: new Date()
        });
        console.log('✅ Created jeevan@gmail.com (bloodbank admin) with password Jeevan123!@#');
    }

    await mongoose.disconnect();
}
reset();
