const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb://blood-db:27017/blood-monolith';

// Request Schema
const requestSchema = new mongoose.Schema({
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bloodGroup: { type: String, required: true },
    unitsNeeded: { type: Number, default: 1 },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed', 'booked'],
        default: 'pending'
    },
    notes: String,
    isActive: { type: Boolean, default: true },
    requestedAt: { type: Date, default: Date.now },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    bloodBankId: { type: mongoose.Schema.Types.Mixed }
});

const Request = mongoose.model('Request', requestSchema, 'donationrequests');

// User Schema (simplified)
const userSchema = new mongoose.Schema({
    username: String,
    email: String
});
const User = mongoose.model('User', userSchema);

// Donor Schema (simplified)
const donorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    bloodGroup: String
});
const Donor = mongoose.model('Donor', donorSchema);


async function debugRequests() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        console.log('\n--- ALL USERS ---');
        const users = await User.find({});
        users.forEach(u => console.log(`ID: ${u._id}, Username: ${u.username}`));

        console.log('\n--- ALL DONORS ---');
        const donors = await Donor.find({});
        donors.forEach(d => console.log(`ID: ${d._id}, UserID: ${d.userId}, Name: ${d.name}`));

        console.log('\n--- ALL REQUESTS ---');
        const requests = await Request.find({}).sort({ requestedAt: -1 });

        if (requests.length === 0) {
            console.log('No requests found in DB.');
        } else {
            for (const r of requests) {
                console.log(`\nRequest ID: ${r._id}`);
                console.log(`Status: ${r.status}`);
                console.log(`RequesterID: ${r.requesterId}`);
                console.log(`DonorID: ${r.donorId}`);
                console.log(`CreatedAt: ${r.requestedAt}`);
                console.log(`Active: ${r.isActive}`);

                const requester = users.find(u => u._id.toString() === r.requesterId?.toString());
                const donor = donors.find(d => d._id.toString() === r.donorId?.toString());

                console.log(`-> Requester Name: ${requester ? requester.username : 'UNKNOWN'}`);
                console.log(`-> Donor Name: ${donor ? (donor.name || 'Donor Found') : 'UNKNOWN'}`);

                if (donor && requester && donor.userId.toString() === requester._id.toString()) {
                    console.log('   (SELF REQUEST)');
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugRequests();
