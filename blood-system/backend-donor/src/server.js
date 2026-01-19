const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-monolith';

// Connect to Database
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Donor Backend connected to MongoDB');

        // Fix: Drop problematic indexes that cause 500 errors
        try {
            const db = mongoose.connection.db;
            const collections = await db.listCollections().toArray();

            // Fix bookings collection
            if (collections.find(c => c.name === 'bookings')) {
                try {
                    await db.collection('bookings').dropIndex('bookingId_1');
                    console.log('✅ Fix: Dropped bookingId_1 index from bookings');
                } catch (e) { /* Ignore if index doesn't exist */ }
            }

            // Fix donationrequests collection
            const requestCollection = collections.find(c => c.name === 'donationrequests' || c.name === 'requests');
            if (requestCollection) {
                try {
                    await db.collection(requestCollection.name).dropIndex('bookingId_1');
                    console.log(`✅ Fix: Dropped bookingId_1 index from ${requestCollection.name}`);
                } catch (e) { /* Ignore */ }
            }
        } catch (err) {
            console.error('⚠️ Error fixing indexes:', err);
        }
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

// Start Server
app.listen(PORT, () => {
    console.log(`🩸 Donor Backend running on port ${PORT}`);
});
