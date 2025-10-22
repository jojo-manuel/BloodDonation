const mongoose = require('mongoose');
require('./Database/db');

async function dropEncryptedMridIndex() {
  try {
    const Patient = require('./Models/Patient');

    // Drop the unique index on encryptedMrid if it exists
    try {
      await Patient.collection.dropIndex('encryptedMrid_1');
      console.log('Dropped index: encryptedMrid_1');
    } catch (error) {
      if (error.code === 27) { // Index not found
        console.log('Index encryptedMrid_1 not found, skipping...');
      } else {
        console.log('Error dropping index:', error.message);
      }
    }

    console.log('Index drop operation completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

dropEncryptedMridIndex();
