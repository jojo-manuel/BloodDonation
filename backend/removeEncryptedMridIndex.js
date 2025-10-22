const mongoose = require('mongoose');
require('dotenv').config();

// Use the same connection string as the main application
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blooddonation';

async function removeEncryptedMridIndex() {
  try {
    // Connect to MongoDB
    if (!MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set.');
    }
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');

    // List all indexes
    const indexes = await patientsCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Remove the encryptedMrid_1 index if it exists
    try {
      await patientsCollection.dropIndex('encryptedMrid_1');
      console.log('✅ Successfully dropped encryptedMrid_1 index');
    } catch (error) {
      if (error.code === 27) { // Index not found
        console.log('ℹ️  encryptedMrid_1 index not found, skipping...');
      } else {
        console.log('❌ Error dropping encryptedMrid_1 index:', error.message);
      }
    }

    // Also try to remove any other encryptedMrid related indexes
    try {
      await patientsCollection.dropIndex({ encryptedMrid: 1 });
      console.log('✅ Successfully dropped encryptedMrid index');
    } catch (error) {
      if (error.code === 27) { // Index not found
        console.log('ℹ️  encryptedMrid index not found, skipping...');
      } else {
        console.log('❌ Error dropping encryptedMrid index:', error.message);
      }
    }

    // List indexes after removal
    const indexesAfter = await patientsCollection.indexes();
    console.log('Indexes after removal:', indexesAfter.map(idx => idx.name));

    console.log('✅ Index removal completed successfully');
  } catch (error) {
    console.error('❌ Error removing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

removeEncryptedMridIndex();
