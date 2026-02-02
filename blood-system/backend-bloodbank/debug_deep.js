
const mongoose = require('mongoose');

async function deeplySearch() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        const token = "TK-DKCRT7";
        const collections = await db.listCollections().toArray();

        for (const c of collections) {
            const name = c.name;
            // Search one doc to see if it has token
            const found = await db.collection(name).findOne({
                $or: [
                    { tokenNumber: { $regex: token, $options: 'i' } },
                    { "bookingDetails.tokenNumber": { $regex: token, $options: 'i' } },
                    { description: { $regex: token, $options: 'i' } }
                ]
            });

            if (found) {
                console.log(`FOUND in collection '${name}':`, found._id);
                console.log(JSON.stringify(found, null, 2));
            }
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
deeplySearch();
