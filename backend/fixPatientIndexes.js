// Script to fix indexes on Patient model, especially unique index on encryptedMrid

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Use the same connection string as the main application
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:zUuZEnV4baqSWUge@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function fixPatientIndexes() {
  try {
    // Connect to MongoDB using same config as main app
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const Patient = require('./Models/Patient');

    // Drop the old unique index on encryptedMrid if it exists
    try {
      await Patient.collection.dropIndex('encryptedMrid_1');
      console.log('Dropped old index: encryptedMrid_1');
    } catch (error) {
      if (error.code === 27) { // Index not found
        console.log('Old index encryptedMrid_1 not found, skipping...');
      } else {
        console.log('Error dropping old index:', error.message);
      }
    }

    // Ensure correct unique index on encryptedMrid exists
    try {
      await Patient.collection.createIndex({ encryptedMrid: 1 }, { unique: true });
      console.log('Created unique index on encryptedMrid');
    } catch (error) {
      console.log('Error creating indexes:', error.message);
    }

    console.log('Patient indexes fixed successfully');
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixPatientIndexes();
