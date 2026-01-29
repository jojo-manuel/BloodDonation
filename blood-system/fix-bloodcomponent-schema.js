const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://blood-db:27017/bloodbank';

async function fixSchema() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the BloodComponent collection
    const db = mongoose.connection.db;
    const collection = db.collection('bloodcomponents');

    // Check if collection exists
    const count = await collection.countDocuments();
    console.log('BloodComponent collection document count:', count);

    if (count === 0) {
      console.log('Collection is empty, dropping it to reset schema...');
      try {
        await collection.drop();
        console.log('Collection dropped successfully');
      } catch (error) {
        console.log('Collection does not exist or already dropped');
      }
    } else {
      console.log('Collection has documents, not dropping');
    }

    console.log('Schema fix completed');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixSchema();