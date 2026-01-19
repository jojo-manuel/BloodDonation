const mongoose = require('mongoose');

// Connect
mongoose.connect('mongodb://blood-db:27017/blood-monolith');

const bookingSchema = new mongoose.Schema({
    date: Date, // Enforce Date type
    hospital_id: String,
    donorName: String,
    bloodGroup: String,
    time: String,
    status: String,
    tokenNumber: String,
    bookingId: String
}, { strict: false });

const Booking = mongoose.model('Booking', bookingSchema);
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function seed() {
    try {
        console.log('Fetching blood banks...');
        const bloodBanks = await User.find({ role: 'bloodbank' });

        if (bloodBanks.length === 0) {
            console.log('No blood bank users found!');
            process.exit(1);
        }

        console.log(`Found ${bloodBanks.length} blood banks. Clearing old bookings...`);
        await Booking.deleteMany({});

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const allBookings = [];

        for (const bb of bloodBanks) {
            console.log(`Generating bookings for ${bb.name} (ID: ${bb.hospital_id})...`);

            const bookings = [
                {
                    hospital_id: bb.hospital_id,
                    donorName: `John Doe (${bb.name})`,
                    bloodGroup: 'A+',
                    date: today, // Date Object
                    time: '10:00 AM',
                    status: 'pending',
                    tokenNumber: Math.floor(Math.random() * 1000).toString(),
                    bookingId: `BK-${bb.hospital_id ? bb.hospital_id.substring(0, 3) : 'TEST'}-1`
                },
                {
                    hospital_id: bb.hospital_id,
                    donorName: `Jane Smith (${bb.name})`,
                    bloodGroup: 'O-',
                    date: today, // Date Object
                    time: '11:00 AM',
                    status: 'confirmed',
                    tokenNumber: Math.floor(Math.random() * 1000).toString(),
                    bookingId: `BK-${bb.hospital_id ? bb.hospital_id.substring(0, 3) : 'TEST'}-2`
                },
                {
                    hospital_id: bb.hospital_id,
                    donorName: `Bob Wilson (${bb.name})`,
                    bloodGroup: 'B+',
                    date: tomorrow, // Date Object
                    time: '09:00 AM',
                    status: 'pending',
                    tokenNumber: Math.floor(Math.random() * 1000).toString(),
                    bookingId: `BK-${bb.hospital_id ? bb.hospital_id.substring(0, 3) : 'TEST'}-3`
                }
            ];
            allBookings.push(...bookings);
        }

        console.log('Seeding new bookings...');
        await Booking.insertMany(allBookings);

        console.log('Done!');
        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        mongoose.disconnect();
    }
}

seed();
