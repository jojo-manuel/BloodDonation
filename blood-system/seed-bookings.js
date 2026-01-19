const mongoose = require('mongoose');

// Connect
mongoose.connect('mongodb://blood-db:27017/blood-monolith');

const bookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model('Booking', bookingSchema);

const today = new Date('2026-01-15').toISOString().split('T')[0]; // YYYY-MM-DD
const tomorrow = new Date('2026-01-16').toISOString().split('T')[0];

const seedData = [
    {
        hospital_id: 'Test Hospital',
        donorName: 'John Doe (Pending Today)',
        bloodGroup: 'A+',
        date: today,
        time: '10:00 AM',
        status: 'pending',
        tokenNumber: '101',
        bookingId: 'BK-101'
    },
    {
        hospital_id: 'Test Hospital',
        donorName: 'Jane Smith (Confirmed Today)',
        bloodGroup: 'O-',
        date: today,
        time: '11:00 AM',
        status: 'confirmed',
        tokenNumber: '102',
        bookingId: 'BK-102'
    },
    {
        hospital_id: 'Test Hospital',
        donorName: 'Bob Wilson (Pending Tmrw)',
        bloodGroup: 'B+',
        date: tomorrow,
        time: '09:00 AM',
        status: 'pending',
        tokenNumber: '103',
        bookingId: 'BK-103'
    }
];

async function seed() {
    try {
        console.log('Clearing old bookings...');
        await Booking.deleteMany({});

        console.log('Seeding new bookings...');
        await Booking.insertMany(seedData);

        console.log('Done!');
        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        mongoose.disconnect();
    }
}

seed();
