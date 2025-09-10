// Script to drop old index on 'user' field and ensure correct indexes for BloodBank model

const mongoose = require('mongoose');
require('dotenv').config();

async function fixBloodBankIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blooddonation');
    console.log('Connected to MongoDB');

    const BloodBank = require('./Models/BloodBank');

    // Drop the old index on 'user' field if it exists
    try {
      await BloodBank.collection.dropIndex('user_1');
      console.log('Dropped old index: user_1');
    } catch (error) {
      if (error.code === 27) { // Index not found
        console.log('Old index user_1 not found, skipping...');
      } else {
        console.log('Error dropping old index:', error.message);
      }
    }

    // Ensure correct indexes exist
    try {
      // Create unique index on userId
      await BloodBank.collection.createIndex({ userId: 1 }, { unique: true });
      console.log('Created unique index on userId');

      // Create unique index on licenseNumber
      await BloodBank.collection.createIndex({ licenseNumber: 1 }, { unique: true });
      console.log('Created unique index on licenseNumber');
    } catch (error) {
      console.log('Error creating indexes:', error.message);
    }

    console.log('BloodBank indexes fixed successfully');
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixBloodBankIndexes();
