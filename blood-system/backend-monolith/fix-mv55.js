
const mongoose = require('mongoose');
// Paths relative to /app inside container
const User = require('./src/modules/auth/models/User');
const Booking = require('./src/modules/bloodbank/models/Booking');

console.log('Connecting to DB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            // 1. Find the logged in bloodbank user
            const email = 'bloodbank@test.com';
            const user = await User.findOne({ email });

            if (!user) {
                console.error(`User ${email} not found! Cannot create booking.`);
                // Try finding ANY bloodbank user
                const anyUser = await User.findOne({ role: 'bloodbank' });
                if (anyUser) {
                    console.log(`Using fallback bloodbank user: ${anyUser.email}`);
                    // proceed with anyUser
                    await createBooking(anyUser);
                } else {
                    console.error('No bloodbank user found at all.');
                }
                process.exit(1);
            } else {
                await createBooking(user);
            }

        } catch (err) {
            console.error('Error:', err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });

async function createBooking(user) {
    console.log(`Creating booking for Hospital ID: '${user.hospital_id}'`);

    // Find a donor
    // We need a valid donorId because schema requires it and ref is 'User'
    const donor = await User.findOne({ role: 'donor' }) || user; // Fallback to self if no donor

    // Check if 'mv55' already exists
    const existing = await Booking.findOne({
        tokenNumber: 'mv55',
        hospital_id: user.hospital_id
    });

    if (existing) {
        console.log('Booking for mv55 already exists.');
        existing.status = 'confirmed';
        await existing.save();
        console.log('Updated status to confirmed.');
    } else {
        console.log('Creating new booking for token: mv55...');
        const newBooking = new Booking({
            tokenNumber: 'mv55',
            bookingId: 'BK-TEST-MV55',
            hospital_id: user.hospital_id,
            status: 'confirmed',
            donorName: donor.name || 'Test Donor (mv55)',
            donorId: donor._id,
            bloodGroup: donor.bloodGroup || 'O+',
            email: donor.email || 'test@mv55.com',
            phone: donor.phone || '5555555555',
            date: new Date(),
            time: '10:00 AM',
            weight: 70,
            bagSerialNumber: 'BAG-MV55'
        });

        await newBooking.save();
        console.log('✅ Success! Created booking for token "mv55".');
    }
    process.exit(0);
}
