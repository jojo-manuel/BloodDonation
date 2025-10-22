const connectDB = require('./backend/Database/db');
const mongoose = require('mongoose');

async function clearData() {
  try {
    await connectDB();
    console.log('Connected to database');

    const Donor = require('./backend/Models/donor');
    const DonationRequest = require('./backend/Models/DonationRequest');

    const donorResult = await Donor.deleteMany({});
    console.log('Deleted', donorResult.deletedCount, 'donors');

    const requestResult = await DonationRequest.deleteMany({});
    console.log('Deleted', requestResult.deletedCount, 'donation requests');

    console.log('Data cleared successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearData();
