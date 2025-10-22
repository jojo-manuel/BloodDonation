const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI;

async function dropEmailIndex() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set. Please set it to your cloud MongoDB URI.');
    }
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop the email index
    await collection.dropIndex('email_1');
    console.log('Successfully dropped email index');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error dropping index:', error);
  }
}

dropEmailIndex();
