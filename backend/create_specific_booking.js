const mongoose = require('mongoose');
const User = require('./Models/User'); // Required dependency
const Booking = require('./Models/Booking');
const BloodBank = require('./Models/BloodBank');
const Donor = require('./Models/donor');

const MONGO_URI = 'mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function createBooking() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find prerequisites
        const bloodBank = await BloodBank.findOne();
        const donor = await Donor.findOne().populate('userId');

        if (!bloodBank || !donor) {
            console.error('Error: Could not find a BloodBank or Donor to link this booking to.');
            return;
        }

        console.log(`Using BloodBank: ${bloodBank.name} (${bloodBank._id})`);
        console.log(`Using Donor: ${donor.name} (${donor._id})`);

        // Check if exists first to avoid error spam
        const cleanup = await Booking.deleteOne({ bookingId: 'BK-20260117-0002' });
        if (cleanup.deletedCount > 0) console.log('Removed existing entry to recreate freshly.');

        const newBooking = new Booking({
            bookingId: 'BK-20260117-0002',
            bloodBankId: bloodBank._id,
            donorId: donor._id,
            date: new Date('2026-01-17T10:00:00'),
            time: '10:00 AM',
            status: 'confirmed',
            tokenNumber: '002',
            bloodGroup: donor.bloodGroup,
            donorName: donor.name || 'Test Donor',
            patientName: 'John Doe',
            patientMRID: 'MR-2026-999',
            bloodBankName: bloodBank.name,
            arrived: false
        });

        await newBooking.save();
        console.log('✅ Successfully created booking: BK-20260117-0002');
        console.log(JSON.stringify(newBooking, null, 2));

    } catch (err) {
        console.error('Failed to create booking:', err);
    } finally {
        await mongoose.disconnect();
    }
}

createBooking();
