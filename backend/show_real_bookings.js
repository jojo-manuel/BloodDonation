const mongoose = require('mongoose');
const Booking = require('./Models/Booking');
const Donor = require('./Models/donor');
const User = require('./Models/User');
const BloodBank = require('./Models/BloodBank');
const fs = require('fs');

const MONGO_URI = 'mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function showRealData() {
    try {
        await mongoose.connect(MONGO_URI);

        const bookings = await Booking.find()
            .populate({
                path: 'donorId',
                populate: { path: 'userId', select: 'name email username phone' }
            })
            .populate('bloodBankId', 'name')
            .sort({ createdAt: -1 });

        const output = bookings.map(b => ({
            bookingId: b.bookingId || '(No Custom ID)',
            mongoId: b._id,
            status: b.status,
            donorName: b.donorId?.userId?.name || b.donorName || 'Unknown',
            donorEmail: b.donorId?.userId?.email || 'No Email',
            bloodBank: b.bloodBankId?.name || b.bloodBankName || 'Unknown',
            date: new Date(b.date).toDateString(),
            time: b.time,
            token: b.tokenNumber
        }));

        fs.writeFileSync('booking_list.json', JSON.stringify(output, null, 2));
        console.log(`Saved ${output.length} bookings to booking_list.json`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

showRealData();
