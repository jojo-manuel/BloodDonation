// Quick script to check and seed inventory data
const mongoose = require('mongoose');

const BloodInventorySchema = new mongoose.Schema({
    hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },
    itemName: String,
    bloodGroup: String,
    donationType: String,
    serialNumber: String,
    firstSerialNumber: Number,
    lastSerialNumber: Number,
    unitsCount: { type: Number, default: 1 },
    collectionDate: Date,
    expiryDate: Date,
    donorName: String,
    status: { type: String, enum: ['available', 'reserved', 'used', 'expired'], default: 'available' },
    location: String,
    temperature: String,
    notes: String,
    allocatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    allocatedAt: Date,
    allocationNotes: String,
    billedTo: String,
    billedAt: Date,
    billingPrice: Number,
    billingNotes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const BloodInventory = mongoose.model('BloodInventory', BloodInventorySchema);

async function checkInventory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blood_donation_system');

        console.log('Connected to MongoDB');

        // Count total inventory
        const totalCount = await BloodInventory.countDocuments();
        console.log(`Total inventory items: ${totalCount}`);

        // Count by status
        const availableCount = await BloodInventory.countDocuments({ status: 'available' });
        const reservedCount = await BloodInventory.countDocuments({ status: 'reserved' });
        const usedCount = await BloodInventory.countDocuments({ status: 'used' });
        const expiredCount = await BloodInventory.countDocuments({ status: 'expired' });

        console.log(`Available: ${availableCount}`);
        console.log(`Reserved: ${reservedCount}`);
        console.log(`Used: ${usedCount}`);
        console.log(`Expired: ${expiredCount}`);

        // Get sample items
        const sampleItems = await BloodInventory.find().limit(5);
        console.log('\nSample items:');
        sampleItems.forEach(item => {
            console.log(`- ${item.itemName || item.bloodGroup} (${item.status}) - Hospital: ${item.hospital_id}`);
        });

        // If no inventory, create sample data
        if (totalCount === 0) {
            console.log('\n⚠️ No inventory found. Creating sample data...');

            // You'll need to get a valid hospital_id from your database
            const BloodBank = mongoose.model('BloodBank', new mongoose.Schema({}, { strict: false }));
            const hospital = await BloodBank.findOne();

            if (!hospital) {
                console.log('❌ No blood bank found. Please create a blood bank first.');
                process.exit(1);
            }

            const sampleInventory = [
                {
                    hospital_id: hospital._id,
                    bloodGroup: 'A+',
                    donationType: 'whole_blood',
                    serialNumber: 'WB-A+-001',
                    unitsCount: 3,
                    collectionDate: new Date(),
                    expiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
                    donorName: 'John Doe',
                    status: 'available',
                    location: 'Refrigerator A, Shelf 1',
                    temperature: '2-6'
                },
                {
                    hospital_id: hospital._id,
                    bloodGroup: 'O-',
                    donationType: 'whole_blood',
                    serialNumber: 'WB-O--001',
                    unitsCount: 2,
                    collectionDate: new Date(),
                    expiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
                    donorName: 'Jane Smith',
                    status: 'available',
                    location: 'Refrigerator A, Shelf 2',
                    temperature: '2-6'
                },
                {
                    hospital_id: hospital._id,
                    bloodGroup: 'B+',
                    donationType: 'platelets',
                    serialNumber: 'PLT-B+-001',
                    unitsCount: 1,
                    collectionDate: new Date(),
                    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
                    donorName: 'Mike Johnson',
                    status: 'available',
                    location: 'Platelet Agitator 1',
                    temperature: '20-24'
                },
                {
                    hospital_id: hospital._id,
                    itemName: 'Blood Collection Bag',
                    serialNumber: 'BCB-001',
                    unitsCount: 50,
                    collectionDate: new Date(),
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                    status: 'available',
                    location: 'Storage Room A',
                    notes: 'Standard 450ml collection bags'
                },
                {
                    hospital_id: hospital._id,
                    itemName: 'Sterile Gloves (Box)',
                    serialNumber: 'SG-001',
                    unitsCount: 10,
                    collectionDate: new Date(),
                    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years
                    status: 'available',
                    location: 'Storage Room B',
                    notes: 'Size M, latex-free'
                }
            ];

            await BloodInventory.insertMany(sampleInventory);
            console.log(`✅ Created ${sampleInventory.length} sample inventory items`);
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkInventory();
