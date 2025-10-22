
const mongoose = require('mongoose');
const BloodBank = require('./Models/BloodBank');

async function dropUserIndex() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set. Please set it to your cloud MongoDB URI.');
    }
    await mongoose.connect(process.env.MONGO_URI);

    console.log('Connected to MongoDB');

    // Drop the problematic index
    try {
      await mongoose.connection.db.collection('bloodbanks').dropIndex('user_1');
      console.log('Dropped old user_1 index');
    } catch (error) {
      console.log('Index user_1 not found or already dropped:', error.message);
    }

    // Create the correct index on userId
    try {
      await mongoose.connection.db.collection('bloodbanks').createIndex({ userId: 1 }, { unique: true });
      console.log('Created new index on userId');
    } catch (error) {
      console.log('Error creating userId index:', error.message);
    }

    console.log('Index fix completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropUserIndex();
