const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:zUuZEnV4baqSWUge@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function dropEmailIndex() {
  try {
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
