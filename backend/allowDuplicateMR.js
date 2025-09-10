// Script to drop unique index on mrid field to allow duplicate MR numbers

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Use the same connection string as the main application
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:zUuZEnV4baqSWUge@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function allowDuplicateMR() {
  try {
    // Connect to MongoDB using same config as main app
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const Patient = require('./Models/Patient');

    // Drop the unique index on mrid field if it exists
    try {
      await Patient.collection.dropIndex('mrid_1');
      console.log('Dropped unique index: mrid_1');
    } catch (error) {
      if (error.code === 27) { // Index not found
        console.log('Unique index mrid_1 not found, skipping...');
      } else {
        console.log('Error dropping unique index:', error.message);
      }
    }

    // Create a non-unique index on mrid for performance (optional)
    try {
      await Patient.collection.createIndex({ mrid: 1 });
      console.log('Created non-unique index on mrid');
    } catch (error) {
      console.log('Error creating non-unique index:', error.message);
    }

    console.log('MR number duplication is now allowed');
  } catch (error) {
    console.error('Error allowing duplicate MR:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

allowDuplicateMR();
